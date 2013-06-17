Parse.Cloud.beforeSave('Post', function(request, response) {
  var message = request.object.get('message');
  if (message == '') {
    response.error('Message must not be empty.');
  } else {
    message = filter(message);
    message = message.substring(0, 256);
    request.object.set('message', message);
    console.log('Cleaned up the post post.')
    response.success();
  }
});

Parse.Cloud.afterSave('Post', function(request) {
  if (request.object.existed()) { 
    return; // skip notifications on update
  }
  console.log('Saved a Post.');
  var pushQuery = new Parse.Query(Parse.Installation);
  var location = request.object.get('location');
  console.log('Sending notifications to installations within 1 mile.');
  pushQuery.withinMiles('location', location, 1);
  pushQuery.limit(1000);
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