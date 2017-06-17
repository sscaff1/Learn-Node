const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const User = mongoose.model('User');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith('image/');
    next(isPhoto ? null : { message: "That file type isn't allowed!" }, isPhoto);
  },
};

exports.homePage = (req, res) => {
  res.render('index');
};

exports.getStoreBySlug = (req, res, next) => {
  Store.findOne({ slug: req.params.slug })
    .populate('author')
    .then(store => (!store ? next() : res.render('store', { title: store.name, store })))
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
    .then(photo => photo.resize(800, jimp.AUTO).write(`./public/uploads/${req.body.photo}`))
    .then(() => next())
    .catch(next);
};

exports.createStore = (req, res, next) => {
  req.body.author = req.user._id;
  const store = new Store(req.body);
  return store
    .save()
    .then(newStore => {
      req.flash('success', `Successfully created ${store.name}. Care to leave a review?`);
      res.redirect(`/store/${newStore.slug}`);
    })
    .catch(next);
};

exports.getStores = (req, res, next) => {
  const page = req.params.page || 1;
  const limit = 4;
  const skip = page * limit - limit;
  const promises = [Store.find().skip(skip).limit(limit).sort({ created: -1 }), Store.count()];
  Promise.all(promises)
    .then(([storesData, count]) => {
      const pages = Math.ceil(count / limit);
      const stores = storesData.map(store =>
        Object.assign(store, {
          description: store.description.split(' ').slice(0, 25).join(' '),
        })
      );
      if (!stores.length && skip) {
        req.flash(
          'info',
          `Hey! You asked for page ${page}. But that doesn't exist. So I put you on page ${pages}`
        );
        res.redirect(`/stores/page/${pages}`);
        return;
      }
      res.render('stores', { title: 'Stores', stores, pages, page, count });
    })
    .catch(next);
};

const confirmOwner = (store, user) => {
  if (!store.author.equals(user._id)) {
    throw Error('You must own a store in order to edit it!');
  }
};

exports.editStore = (req, res, next) => {
  Store.findOne({ _id: req.params.id })
    .then(store => {
      confirmOwner(store, req.user);
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
    .then(([tags, stores]) => res.render('tags', { title: 'Tags', tags, tag, stores }))
    .catch(next);
};

exports.searchStores = (req, res, next) => {
  Store.find(
    {
      $text: {
        $search: req.query.q,
      },
    },
    {
      score: { $meta: 'textScore' },
    }
  )
    .sort({ score: { $meta: 'textScore' } })
    .limit(5)
    .then(stores => {
      res.json(stores);
    })
    .catch(next);
};

exports.mapStores = (req, res, next) => {
  const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
  const q = {
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates },
        $maxDistance: 10000,
      },
    },
  };
  Store.find(q)
    .select('slug name description location photo')
    .limit(10)
    .then(stores => {
      res.json(stores);
    })
    .catch(next);
};

exports.mapPage = (req, res) => {
  res.render('map', { title: 'Map' });
};

exports.heartStore = (req, res, next) => {
  const hearts = req.user.hearts.map(obj => obj.toString());
  const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';
  User.findByIdAndUpdate(req.user.id, { [operator]: { hearts: req.params.id } }, { new: true })
    .then(user => res.json(user))
    .catch(next);
};

exports.getTopStores = (req, res, next) => {
  Store.getTopStores()
    .then(stores => res.render('topStores', { stores, title: 'Top Stores!' }))
    .catch(next);
};
