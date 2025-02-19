const multer = require('multer');
const sharp = require('sharp');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   }
// });
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

function initializeUserData(userData) {
  // تبدیل تعداد وابستگان به عدد صحیح
  const dependentCount = userData.DependentNumber
    ? parseInt(userData.DependentNumber)
    : 0;

  // لیست کلیدهای اصلی (برای تولید وابستگان)
  const keys = Object.keys(userData);

  // ایجاد آرایه از آبجکت‌های خالی بر اساس تعداد وابستگان
  const userDependents = Array.from({ length: dependentCount }, () =>
    keys.reduce((acc, key) => {
      if (key !== 'DependentNumber') acc[key] = ''; // مقدار پیش‌فرض رشته‌ی خالی
      return acc;
    }, {}),
  );

  // افزودن پراپرتی userDependent به داده‌ی اصلی
  return {
    ...userData,
    userDependent: userDependents,
  };
}

function transformData(data) {
  const mainObject = {};
  const dependentArray = [];

  // دریافت تعداد وابستگان
  const dependentCount = data.DependentNumber ? parseInt(data.DependentNumber) : 0;

  // پیمایش روی کلیدهای آبجکت
  Object.keys(data).forEach((key) => {
    // اگر مقدار یک آرایه باشد، مقدار اول را برای آبجکت اصلی بردار
    if (Array.isArray(data[key])) {
      mainObject[key] = data[key][0]; // مقدار اول برای آبجکت اصلی

      // ایجاد آبجکت‌های وابستگان
      for (let i = 1; i < data[key].length; i++) {
        if (!dependentArray[i - 1]) dependentArray[i - 1] = {}; // ایجاد آبجکت در آرایه
        dependentArray[i - 1][key] = data[key][i]; // مقداردهی کلیدهای آبجکت وابسته
      }
    } else {
      // اگر مقدار آرایه نبود، به آبجکت اصلی اضافه شود
      mainObject[key] = data[key];
    }
  });

  return { mainObject, dependentArray };
}

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400,
      ),
    );
  }

  
  // 2) Filtered out unwanted fields names that are not allowed to be updated
  // const filteredBody = filterObj(
  //   req.body,
  //   'name',
  //   'email',
  //   'lastName',
  //   'nationalCode',
  //   'identityNumber',
  //   'fatherName',
  //   'birthYear',
  //   'birthMonth',
  //   'birthDay',
  //   'insuranceStart',
  //   'insuranceEnd',
  //   'insuredType',
  //   'relationWithInsured',
  //   'dependentType',
  //   'DependentNumber',
  //   'phoneNumber',
  //   'bankAccountIBAN',
  // );
  const findUser = await User.findOne({_id : req.user.id})
  console.log("🚀 ~ exports.updateMe=catchAsync ~ findUser:", findUser)
  if (findUser.userDependent.length === 0){
    const firstInitial = initializeUserData(req.body);
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      firstInitial,
      {
        new: true,
        runValidators: true,
      },
    );

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser,
      },
    });
  } else {
    const { mainObject, dependentArray } = transformData(req.body);
    const lastObject = { ...mainObject, userDependent: dependentArray };
 
    if (req.file) filteredBody.photo = req.file.filename;
 
    // 3) Update user document
    const updatedUser = await User.findByIdAndUpdate(req.user.id, lastObject, {
      new: true,
      runValidators: true,
    });
 
    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser,
      },
    });
  
  }
  
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup instead',
  });
};

exports.getUser = factory.getOne(User);
exports.getAllUsers = factory.getAll(User);

// Do NOT update passwords with this!
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
