const mongoose = require('mongoose');
const Review = mongoose.model('Review');

exports.addReview = (req, res, next) => {
  req.body.author = req.user._id;
  req.body.store = req.params.id;
  const newReview = new Review(req.body);
  newReview.save().then(() => {
    req.flash('success', 'Review Saved!');
    res.redirect('back');
  });
};
