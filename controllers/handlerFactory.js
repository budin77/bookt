const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIQuery = require('./../utils/apiQuery');

exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No document found with that id', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  });

exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!doc) {
      return next(new AppError('No document found with that id', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.createOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.getOne = (Model, populateOptionsObj) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);

    if (populateOptionsObj) {
      query = query.populate(populateOptionsObj);
    }
    const doc = await query;

    if (!doc) {
      return next(new AppError('No document found with that id', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.getAll = Model =>
  catchAsync(async (req, res, next) => {
    //nested GET reviews on Tour(hack - for refractoring code)
    const filter = {};
    if (req.params.tourId) filter.tour = req.params.tourId;

    const apiQuery = new APIQuery(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    //EXECUTE QUERY
    //use exec to retun a promise otherwise return a thenable object
    //const doc = await apiQuery.query.explain();
    const doc = await apiQuery.query;

    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: {
        data: doc
      }
    });
  });
