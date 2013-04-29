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

Parse.Cloud.beforeSave(Parse.User, function(request, response) {
  console.log('Updating user: ' + request.object.id);
  var userQuery = new Parse.Query(Parse.User);
  userQuery.get(request.object.id, {
    success: function(user) {
      if (user.get('points') == null || user.get('checkIn') == null) {
        console.log('New user, awarding a point.');
        request.object.set('points', 1);
        response.success(request.object, 'You just earned a point for signing up.');
      } else {
        console.log('Testing user check-in to see if point should be awarded.');
        var lastDay = getDay(user.get('checkIn'));
        var today = getDay(request.object.get('checkIn'));
        var serverDay = getDay(new Date());
        if (today - lastDay >= 1 && today - serverDay <= 2) {
          request.object.set('points', user.get('points') + 1);
          console.log('User checking in, awarding a point.');
          response.success(request.object, 'You just earned a point for checking in.');
        } else {
          // just in case they tried to set extra points.
          request.object.set('points', user.get('points'));
          console.log('User does not get a point.');
          response.success(request.object, 'You do not get points for checking in more than once a day.');
        }
      }
    },
    error: function(object, error) {
      response.error('Failed to retrieve user: ' + error.message);
    }
  });
});

/*
// this works, but no message. try one more time with before save, but test for null user better.??
Parse.Cloud.afterSave(Parse.User, function(request) {
  console.log('Updating user: ' + request.object.id);
  var user = request.object;  
  console.log('Testing user check-in to see if point should be awarded.');
  if (user.get('points') == null || user.get('lastCheckIn') == null) {
    console.log('New user, awarding a point.');
    user.set('points', 1);
  } else {
    // give the user a point for checking in if it's been at least a day
    var lastDay = getDay(user.get('lastCheckIn'));
    var today = getDay(request.object.get('checkIn'));
    var serverDay = getDay(new Date());
    if (today - lastDay >= 1 && today - serverDay <= 2) {
      user.set('points', user.get('points') + 1);
      console.log('User checking in, awarding a point.');
    } else {
      // just in case they tried to set extra points.
      user.set('points', user.get('points'));
      console.log('User does not get a point.');
    }
  }
  user.set('lastCheckIn', request.object.get('checkIn'));
  user.save();
  console.log('User saved.');
});
*/

Parse.Cloud.beforeSave('Post', function(request, response) {
  if (request.object.get('message') == '') {
    response.error('Message must not be empty.');
  } else {
    // throw an error if the device has already issued a broadcast message today    
    // find the most recent post by the device
    var Post = Parse.Object.extend('Post');
    var postQuery = new Parse.Query(Post);
    postQuery.equalTo('installationId', request.object.get('installationId'));
    postQuery.equalTo('type', 'broadcast');
    postQuery.descending('createdAt');
    postQuery.first({
      success: function(post) {
        var now = new Date();
        // for now let them always shout
        if (false && post != undefined && request.object.get('type') == 'broadcast' && now.getTime() - post.createdAt.getTime() < 1000 * 60 * 60 * 24) {
          console.log('Installation attempted to shout more than once in a 24 hour period.');
          // make a pretty version of the time until the next post
          var nextPostText = '';
          var nextPostTime = post.createdAt.getTime() + (1000 * 60 * 60 * 24);
          var minutesUntilNextPost = (nextPostTime - now.getTime()) / 1000 / 60;
          if (minutesUntilNextPost > 60) {
            var hoursUntilNextPost = Math.floor(minutesUntilNextPost / 60);
            nextPostText += hoursUntilNextPost + 'h ';
          }
          nextPostText += Math.round(minutesUntilNextPost % 60) + 'm'
          // alert the user
          response.error('You can\'t shout twice in a day. Don\'t shout your message or wait ' + nextPostText + '.');
        } else {
          // clean up the message
          var message = request.object.get('message');
          message = filter(message);
          message = message.substring(0, 256);
          request.object.set('message', message);
          console.log('Cleaned up the post post.')
          response.success();
        }
      },
      error: function(error) {
        console.log('Error: ' + error.code + ' ' + error.message);
        response.error(error.message);
      }
    });

  }
});

Parse.Cloud.afterSave('Post', function(request) {
  console.log('Saved a Post.');
  var pushQuery = new Parse.Query(Parse.Installation);
  pushQuery.withinMiles('location', request.object.get('location'), 1.0);
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