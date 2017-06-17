const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slugs = require('slugs');

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: 'Please enter a store name!',
  },
  slug: String,
  description: {
    type: String,
    trim: true,
  },
  tags: [String],
  created: {
    type: Date,
    default: Date.now,
  },
  location: {
    type: {
      type: String,
      default: 'Point',
    },
    coordinates: [{ type: Number, required: 'You must supply coordinates!' }],
    address: {
      type: String,
      required: 'You must supply an address!',
    },
  },
  photo: String,
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: 'You must supply an author',
  },
});

// Define our indexes
storeSchema.index({
  name: 'text',
  description: 'text',
});

storeSchema.index({ location: '2dsphere' });

storeSchema.pre('save', function(next) {
  if (!this.isModified('name')) {
    return next();
  }
  this.slug = slugs(this.name);
  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
  this.constructor.find({ slug: slugRegEx }).then(stores => {
    if (stores.length) {
      this.slug = `${this.slug}-${stores.length + 1}`;
    }
    next();
  });
});

function autopopulate(next) {
  this.populate('reviews');
  next();
}

storeSchema.pre('find', autopopulate);
storeSchema.pre('findOne', autopopulate);

storeSchema.statics.getTagsList = function() {
  return this.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
};

storeSchema.statics.getTopStores = function() {
  return this.aggregate([
    { $lookup: { from: 'reviews', localField: '_id', foreignField: 'store', as: 'reviews' } },
    { $match: { 'reviews.1': { $exists: true } } },
    {
      $project: {
        photo: '$$ROOT.photo',
        name: '$$ROOT.name',
        reviews: '$$ROOT.reviews',
        slug: '$$ROOT.slug',
        averageRating: { $avg: '$reviews.rating' },
      },
    },
    { $sort: { averageRating: -1 } },
    { $limit: 10 },
  ]);
};

storeSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id', // which field on the store
  foreignField: 'store', // which field on the review
});

module.exports = mongoose.model('Store', storeSchema);
