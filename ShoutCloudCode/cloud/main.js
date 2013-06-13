var Account = Parse.Object.extend('Account');
Parse.Cloud.beforeSave(Parse.User, function(request, response) {
  console.log('Updating user: ' + request.object.id);
  var user = request.object;
  if (user.get('account') == null) {
    console.log('New user, creating account and awarding a point.');
    var account = new Account();
    account.set('points', 10);
    account.set('lastCheckIn', user.get('checkIn'));
    account.save(null, {
      success: function(account) {
        user.set('account', account);
        user.set('alert', 'Welcome to Schowt and congrats: you earned 10 points just for showing up. Check in once a day to earn more points. The more points you have, the more (and louder) you can shout.');
        response.success();
      }, 
      error: function(object, error) {
        response.error('Failed to save account: ' + error.message);
      }
    });
  } else {
    console.log('Loading user account and testing check-ins to see if point should be awarded.');
    var account = user.get('account');
    account.fetch({
      success: function(account) {
        var lastDay = account.get('lastCheckIn');
        var today = user.get('checkIn');
        var serverDay = getDay(new Date());
        if (today - lastDay >= 1 && today - serverDay <= 2) {
          console.log('User checking in, awarding a point.'); 
          account.set('points', account.get('points') + 10);
          user.set('alert', 'Congrats! You earned another 10 points for checking in today. Keep checking in each day so you can shout louder. Or buy some points and cheat.');
        } else {
          // user does not get a point
          console.log('Leaving user as is, with existing points: ' + account.get('points'));
        }
        account.set('lastCheckIn', user.get('checkIn'));
        account.save(null, {
          success: function(account) {
            response.success();
          },
          error: function(object, error) {
            response.error('Failed to save account: ' + error.message);
          }
        });
      },
      error: function(object, error) {
        response.error('Failed to load account: ' + error.message);
      }
    });
  }
});

var products = {
  'com.davidhendee.schowt.product.10': 10,
  'com.davidhendee.schowt.product.100': 100,
  'com.davidhendee.schowt.product.1000': 1000,
}

Parse.Cloud.beforeSave('Transaction', function(request, response) {
  console.log('Received a transaction from the user, verifying purchase with app store.');
  var transaction = request.object;
  Parse.Cloud.httpRequest({
    method: 'POST',
    // todo, switch to real store for launch
    // url: 'https://buy.itunes.apple.com/verifyReceipt',
    url: 'https://sandbox.itunes.apple.com/verifyReceipt',
    headers: {
      'Content-Type': 'application/json'
    },
    body: {
      'receipt-data': transaction.get('receipt'),
      'password': '278ff5a80a3049d29bcfbefe210d249e'
    },
    success: function(httpResponse) {
      var data = JSON.parse(httpResponse.text);
      if (data['status'] == 0) {
        console.log('User purchased product: ' + transaction.get('productId'));
        var user = transaction.get('user');
        user.fetch({
          success: function(user) {
            var account = user.get('account');
            account.fetch({
              success: function(account) {
                account.set('points', account.get('points') + products[transaction.get('productId')]);
                account.save(null, {
                  success: function(account) {
                    console.log('Successfully saved account.');
                    response.success();
                  },
                  error: function(object, error) {
                    response.error('Failed to save account: ' + error.message);
                  }
                });
              }
            });
          }
        });
      } else {
        response.error('Invalid receipt. Please check your account and contact customer support, if necessary.');
      }
    },
    error: function(httpResponse) {
      response.error('Request failed with response code ' + httpResponse.status);
    }
  });
});

Parse.Cloud.beforeSave('Post', function(request, response) {
  var message = request.object.get('message');
  var distance = parseInt(request.object.get('distance'), 10);
  if (message == '') {
    response.error('Message must not be empty.');
  } else if (distance != 1 && distance != 10 && distance != 100 && distance != 1000) {
    response.error('Distance is invalid.');
  } else {
    if (request.object.existed()) { 
      console.log('Updating post, skipping points removal.');
      response.success(); // skip points on update
    }
    // load the user
    var user = request.object.get('user');
    user.fetch({
      success: function(user) {
        // load the user's account
        var account = user.get('account');
        account.fetch({
          success: function(account) {
            var points = parseInt(account.get('points'), 10);
            // check to see if they have enough points
            if (points < distance) {
              // if they don't have enough points, send an error
              response.error('Sorry, you don\'t have enough points for this.');
            } else {
              // clean up the message
              message = filter(message);
              message = message.substring(0, 256);
              request.object.set('message', message);
              console.log('Cleaned up the post post.')
              // otherwise remove the points
              account.set('points', points - distance);
              account.save(null, {
                success: function(account) {
                  console.log('User account saved with updated points total: ' + account.get('points'));
                  response.success();
                },
                error: function(object, error) {
                  response.error('Failed to save user account: ' + error.message);
                }
              });
            }
          }
        });
      },
      error: function(object, error) {
        response.error('Failed to load user: ' + error.message);
      }
    });
  }
});

Parse.Cloud.afterSave('Post', function(request) {
  if (request.object.existed()) { 
    return; // skip notifications on update
  }
  console.log('Saved a Post.');
  var pushQuery = new Parse.Query(Parse.Installation);
  var location = request.object.get('location');
  var distance;
  if (request.object.get('distance') == 1) {
    distance = 0.25; // a few blocks
  } else if (request.object.get('distance') == 10) {
    distance = 1; // one mile
  } else if (request.object.get('distance') == 1000) {
    distance = 500; // the length of california
  } else if (request.object.get('distance') == 1000) {
    distance = 3958.8; // the radius of the earth
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