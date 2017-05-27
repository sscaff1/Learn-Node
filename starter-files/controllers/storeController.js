const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith('image/');
    next(
      isPhoto ? null : { message: "That file type isn't allowed!" },
      isPhoto
    );
  },
};

exports.homePage = (req, res) => {
  res.render('index');
};

exports.getStoreBySlug = (req, res, next) => {
  Store.findOne({ slug: req.params.slug })
    .then(
      store =>
        !store ? next() : res.render('store', { title: store.name, store })
    )
    .catch(next);
};

exports.addStore = (req, res) => {
  res.render('editStore', { title: 'Add Store' });
};

exports.upload = multer(multerOptions).single('photo');

exports.resize = (req, res, next) => {
  if (!req.file) return next();
  const extension = req.file.mimetype.split('/')[1];
  req.body.photo = `${uuid.v4()}.${extension}`;
  jimp
    .read(req.file.buffer)
    .then(photo =>
      photo.resize(800, jimp.AUTO).write(`./public/uploads/${req.body.photo}`)
    )
    .then(() => next())
    .catch(next);
};

exports.createStore = (req, res, next) => {
  const store = new Store(req.body);
  return store
    .save()
    .then(newStore => {
      req.flash(
        'success',
        `Successfully created ${store.name}. Care to leave a review?`
      );
      res.redirect(`/store/${newStore.slug}`);
    })
    .catch(next);
};

exports.getStores = (req, res, next) => {
  Store.find()
    .then(storesData => {
      const stores = storesData.map(store =>
        Object.assign(store, {
          description: store.description.split(' ').slice(0, 25).join(' '),
        })
      );
      res.render('stores', { title: 'Stores', stores });
    })
    .catch(next);
};

exports.editStore = (req, res, next) => {
  Store.findOne({ _id: req.params.id })
    .then(store => {
      res.render('editStore', { title: `Edit ${store.name}`, store });
    })
    .catch(next);
};

exports.updateStore = (req, res, next) => {
  req.body.location.type = 'Point';
  Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true,
    runValidators: true,
  })
    .exec()
    .then(store => {
      req.flash(
        'success',
        `Successfuly update <strong>${store.name}</strong>. <a href="${store.slug}">View Store</a>`
      );
      res.redirect('back');
    })
    .catch(next);
};

exports.getStoresByTag = (req, res, next) => {
  const tag = req.params.tag;
  const tagQuery = tag || { $exists: true };
  const promises = [Store.getTagsList(), Store.find({ tags: tagQuery })];
  Promise.all(promises)
    .then(([tags, stores]) =>
      res.render('tags', { title: 'Tags', tags, tag, stores })
    )
    .catch(next);
};
