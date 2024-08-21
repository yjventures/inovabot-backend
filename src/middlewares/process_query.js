const process_query = (req, res, next) => {
  try {
    if (req?.query) {
       for (let item in req.query) {
        if (req.query[item] === 'true') {
          req.query[item] = true;
        } else if (req.query[item] === 'false') {
          req.query[item] = false;
        } else if (req.query[item] === 'undefined') {
          req.query[item] = undefined;
        } else if (req.query[item] === 'null') {
          req.query[item] = null;
        }
        if (item === 'search') {
          if (!req.query[item]) {
            delete req.query[item];
          }
        }
        if (item === 'sortOrder') {
          if (req.query.sortOrder === 'desc' && req.query.sortBy) {
            req.query.sortBy = `-${req.query.sortBy}`;
          }
          delete req.query.sortOrder;
        }
       }
    }
    next();
  } catch (err) {
    throw err;
  }
};

module.exports = {
  process_query,
};