Parse.Cloud.beforeSave('Post', function(request, response) {
  if (request.object.get('message') == '') {
    response.error('Message must not be empty.');
  } else {
    response.success();
  }
});

Parse.Cloud.afterSave('Post', function(request) {
  console.log('Saved a Post.');

  // find installations near the post's location
  var pushQuery = new Parse.Query(Parse.Installation);
  pushQuery.withinMiles('location', request.object.get('location'), 1.0);
   
  // send push notification to query
  Parse.Push.send({
    where: pushQuery,
    data: {
      alert: request.object.get('message')
    }
  }, {
    success: function() {
      console.log('Sent a push notification.');
    },
    error: function(error) {
      console.log(error);
    }
  });
});