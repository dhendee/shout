function filter(text) {
  var words = ['shit', 'piss', 'fuck', 'cunt', 'cocksucker', 'motherfucker', 'tits'];
  var replacement = '@#$%&!';
  for (var i = 0; i < words.length; i++) {
    var pattern = new RegExp('\\b' + words[i] + '\\b', 'g');
    text = text.replace(pattern, replacement);
  }  
  return text;
}

Parse.Cloud.beforeSave('Post', function(request, response) {
  if (request.object.get('message') == '') {
    response.error('Message must not be empty.');
  } else {
    // clean up the message
    var message = request.object.get('message');
    message = filter(message);
    message = message.substring(0, 256);
    request.object.set('message', message);
    response.success();
  }
});

Parse.Cloud.afterSave('Post', function(request) {
  console.log('Saved a Post.');

  var pushQuery = new Parse.Query(Parse.Installation);

  pushQuery.equalTo('type', 'broadcast');
  pushQuery.withinMiles('location', request.object.get('location'), 1.0);
   
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