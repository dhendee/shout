Parse.Cloud.beforeSave(Parse.User, function(request, response) {
  console.log('Updating user: ' + request.object.id);
  var userQuery = new Parse.Query(Parse.User);
  userQuery.get(request.object.id, {
    success: function(user) {
      if (user.get('points') == null || user.get('checkIn') == null) {
        console.log('New user, awarding a point.');
        request.object.set('alert', 'Congrats! You earned a point for using Shout.');
        request.object.set('points', 1);
        response.success();
      } else {
        console.log('Testing user check-in to see if point should be awarded.');
        var lastDay = user.get('checkIn');
        var today = request.object.get('checkIn');
        var serverDay = getDay(new Date());
        if (today - lastDay >= 1 && today - serverDay <= 2) {
          console.log('User checking in, awarding a point.');
          request.object.set('alert', 'Congrats! You earned a point for checking in today.');
          request.object.set('points', user.get('points') + 1);
          response.success();
        } else {
          // user does not get a point
          console.log('Leaving user as is, with existing points: ' + user.get('points'));
          response.success();
        }
      }
    },
    error: function(object, error) {
      response.error('Failed to retrieve user: ' + error.message);
    }
  });
});

Parse.Cloud.beforeSave('Post', function(request, response) {
  var message = request.object.get('message');
  var distance = parseInt(request.object.get('distance'), 10);
  if (message == '') {
    response.error('Message must not be empty.');
  } else if (distance != 0 && distance != 1 && distance != 10 && distance != 100) {
    response.error('Distance is invalid.');
  } else {
    // load the user
    var userQuery = new Parse.Query(Parse.User);
    userQuery.get(request.object.get('user').id, {
      success: function(user) {
        var points = parseInt(user.get('points'), 10);
        // check to see if they have enough points
        if (points < distance) {
          // if they don't have enough points, send an error
          response.error('Insufficient points for distance.');
        } else {
          // clean up the message
          message = filter(message);
          message = message.substring(0, 256);
          request.object.set('message', message);
          console.log('Cleaned up the post post.')
          // otherwise remove the points
          user.set('points', points - distance);
          user.save(null, {
            success: function(user) {
              console.log('User saved with updated points total: ' + user.get('points'));
              response.success();
            },
            error: function(object, error) {
              response.error('Failed to save user: ' + error.message);
            }
          });
        }
      },
      error: function(object, error) {
        response.error('Failed to retrieve user: ' + error.message);
      }
    });
  }
});

Parse.Cloud.afterSave('Post', function(request) {
  console.log('Saved a Post.');
  var pushQuery = new Parse.Query(Parse.Installation);
  var location = request.object.get('location');
  var distance;
  if (request.object.get('distance') == 0) {
    distance = 0.25;
  } else if (request.object.get('distance') == 100) {
    distance = 3958.8; // the radius of the earth
  } else {
    distance = request.object.get('distance');
  }
  console.log('Sending notifications to installations within ' + distance + ' miles.');
  pushQuery.withinMiles('location', location, distance);
  Parse.Push.send({
    where: pushQuery,
    data: {
      alert: request.object.get('message'),
      badge: 'Increment'
    }
  }, {
    success: function() {
      console.log('Sent a push notification.');
    },
    error: function(error) {
      console.log('Error: ' + error.code + ' ' + error.message);
    }
  });
});

function filter(text) {
  var words = ['shit', 'piss', 'fuck', 'cunt', 'cocksucker', 'motherfucker', 'tits'];
  var replacement = '@#$%&!';
  for (var i = 0; i < words.length; i++) {
    var pattern = new RegExp('\\b' + words[i] + '\\b', 'gi');
    text = text.replace(pattern, replacement);
  }  
  return text;
}

function getDay(date) {
  return parseInt(date.getFullYear() + ('0' + (date.getMonth() + 1)).slice(-2) + ('0' + date.getDate()).slice(-2));
}