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
  return date.getFullYear() + date.getMonth() + date.getDate();
}

/*
Parse.Cloud.beforeSave(Parse.Installation, function(request, response) {
  console.log('Updating installation: ' + request.object.id);
  var installationQuery = new Parse.Query(Parse.Installation);
  installationQuery.find({
    success: function(results) {
      console.log("Successfully retrieved " + results.length + " scores.");
    },
    error: function(error) {
      console.log("Error: " + error.code + " " + error.message);
    }
  });
  // Clients aren't allowed to perform the find operation on the installation collection
  // need to make a user object?
  installationQuery.equalTo('installationId', request.object.id);
  installationQuery.first({
    success: function(installation) {
      console.log('Checking installation to see if point should be awarded.');
      if (installation.get('points') == null) {
        installation.set('points', 1);
        console.log('New installation, awarding one point.');
        response.success('You\ve earned a point for checking in today.');
      } else {
        // give the user a point for checking in if it's been at least a day
        var oldClientDay = getDay(installation.get('clientUpdatedAt'));
        var newClientDay = getDay(request.object.get('clientUpdatedAt'));
        var serverDay = getDay(new Date());
        if (newDay - oldDay >= 1 && newDay - serverDay <= 2) {
          installation.set('points', installation.get('points') + 1);
          console.log('User checking in, awarding a point.');
          response.success('You\'ve earned a point for checking in today.');
        } else {
          // just in case they tried to set extra points.
          installation.set('points', installation.get('points'));
          response.success();
        }
      }
      response.success();
    },
    error: function(installation, error) {
      console.log('Could not retrieve installation with id: ' + request.object.id);
      response.success();
    }
  });
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
  if (request.object.get('type') == 'broadcast') {
    var pushQuery = new Parse.Query(Parse.Installation);
    pushQuery.withinMiles('location', request.object.get('location'), 1.0);
    Parse.Push.send({
      where: pushQuery,
      data: {
        alert: request.object.get('message'),
        badge: "Increment"
      }
    }, {
      success: function() {
        console.log('Sent a push notification.');
      },
      error: function(error) {
        console.log('Error: ' + error.code + ' ' + error.message);
      }
    });
  }

});