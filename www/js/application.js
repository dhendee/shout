var parseApplicationId = 'CBV56vJgLv8chR4XfRjepzFhTTc88KXdR2xiO5Ic';
var parseRestApiKey = 'piFbaPMnFN66Ah2gs3Y6MrmSQRsxFNDtKNurT70y';
var parseJavascriptApiKey = 'z4ToJJNWGSeYeLh5MIEsJ5bMtOd7R7KMyuYgch0p';

Parse.initialize(parseApplicationId, parseJavascriptApiKey);
var Post = Parse.Object.extend('Post');
var latitude, longitude;

function clearData() {
  localStorage.removeItem('username');
  localStorage.removeItem('password');
  localStorage.removeItem('installationId');
  Parse.User.logOut();
}

function findPosts() {
  $('#refresh').addClass('loading');
  $('#notice').html('');

  var location = new Parse.GeoPoint({
    latitude: latitude, 
    longitude: longitude
  });

  var worldPosts = new Parse.Query(Post);
  worldPosts.equalTo('distance', '1000');

  var statePosts = new Parse.Query(Post);
  statePosts.equalTo('distance', '100');

  var cityPosts = new Parse.Query(Post);
  cityPosts.equalTo('distance', '10');
  cityPosts.withinMiles('location', location, 10);

  var neighborhoodPosts = new Parse.Query(Post);
  neighborhoodPosts.equalTo('distance', '1');
  neighborhoodPosts.withinMiles('location', location, 1);

  var posts = Parse.Query.or(worldPosts, statePosts, cityPosts, neighborhoodPosts);
  posts.limit(100);
  posts.descending('createdAt');

  posts.find({
    success: function(results) {
      console.log('Found ' + results.length + ' posts nearby.');
      if (results.length == 0) {
        $('#notice').append('<p>No shouts found nearby.</p>');
      } else {
        var list = $('#posts');
        list.html('');
        for (var i = 0; i < results.length; i++) {
          var post = results[i];
          var createdAt = post.createdAt.toISOString();
          var distance;
          switch (post.get('distance')) {
            case '1':
              distance = 'within &frac14; mile';
              break;
            case '10':
              distance = 'within 1 mile';
              break;
            case '100':
              distance = 'within 500 miles';
              break;
            default:
              distance = 'somewhere in the world';
          }
          list.append('<li data-image="' + post.get('image').url + '"><span class="message">' + post.get('message') + ' </span><small><time class="timeago" datetime="' + createdAt + '">' + createdAt + '</time>, ' + distance +  '</small></li>');
        }
        list.find('li').on('click', function() {
          var item = $(this);
          var shareContent = $('#share-content');
          shareContent.html($('.message', item).html());
          shareContent.data('image', item.data('image'));
          $.mobile.changePage('#share');
        });
        list.listview('refresh');
        $('time.timeago').timeago();
      }
      $('#refresh').removeClass('loading');
      $.mobile.loading('hide');
    },
    error: function(error) {
      alert('Error: ' + error.code + ' ' + error.message);
      $.mobile.loading('hide');
      $('#refresh').removeClass('loading');
    }
  });
}

$('#message').on('focus', function() {
  $('#post-content').addClass('open');
});

$('#posts-content, #header, #refresh, #points').on('click', function() {
  $('#post-content').removeClass('open');
});  

$('form#post').on('submit', function() {
  $('#submit').addClass('ui-disabled');
  $.mobile.loading('show');
  var post = new Post();
  var location = new Parse.GeoPoint({
    latitude: latitude, 
    longitude: longitude
  });
  var form = $(this);
  var message = $('#message', form);
  var distance = $('#distance', form);
  post.set('user', Parse.User.current());
  post.set('location', location);
  post.set('message', message.val());
  post.set('distance', distance.val());
  post.save(null, {
    success: function(post) {
      var image = textToImage(message.val());
      $.ajax({
        type: "POST",
        beforeSend: function(request) {
          request.setRequestHeader('X-Parse-Application-Id', parseApplicationId);
          request.setRequestHeader('X-Parse-REST-API-Key', parseRestApiKey);
          request.setRequestHeader('Content-Type', 'image/png');
        },
        url: 'https://api.parse.com/1/files/' + post.id + '.png',
        data: image,
        processData: false,
        contentType: false,
        success: function(image) {
          console.log('Image uploaded: ' + image.url);
          var params = {
            'image': {
              '__type': 'File',
              'name': image.name
            }
          };
          $.ajax({
            type: 'PUT',
            url: 'https://api.parse.com/1/classes/Post/' + post.id,
            beforeSend: function(xhr) {
              xhr.setRequestHeader('X-Parse-Application-Id', parseApplicationId);
              xhr.setRequestHeader('X-Parse-REST-API-Key', parseRestApiKey);
              xhr.setRequestHeader('Content-Type', 'application/json');
            },
            data: JSON.stringify(params),
            success: function(post) {
              console.log('Post image saved: ' + post.image.url);
              message.val('');
              distance.val(1).selectmenu('refresh');
              checkIn();
              $('#post-content').removeClass('open');
            },
            error: function(post, error) {
              alert('Post image save failed: ' + error.message);
            },
            dataType: 'json'
          });
        },
        error: function(error) {
          console.log('Image upload failed: ' + error.message);
        }
      });
    },
    error: function(object, response) {
      alert(response.message);
      $.mobile.loading('hide');
    }
  });
  return false;
});

function login() {
  if (Parse.User.current()) {
    console.log('User already logged in.');
    checkIn();
  } else {
    var username = window.localStorage.getItem('username');
    var password = window.localStorage.getItem('password');
    if (username != null && password != null) {
      console.log('We have saved user info, loggin in.');
      Parse.User.logIn(username, password, {
        success: function(user) {
          checkIn();
        },
        error: function(user, error) {
          alert('Error: ' + error.code + ' ' + error.message);
        }
      });      
    } else {
      // generate a random username and password for this client
      console.log('No saved user info, signing up.');
      var user = new Parse.User();
      var username = guid();
      var password = guid();
      user.set('username', username);
      user.set('password', password);
      user.signUp(null, {
        success: function(user) {
          window.localStorage.setItem('username', username);
          window.localStorage.setItem('password', password);
          checkIn();
        },
        error: function(user, error) {
          alert('Error: ' + error.code + ' ' + error.message);
        }
      });    
    }
  }
}

function guid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });
}

function getDay(date) {
  return parseInt(date.getFullYear() + ('0' + (date.getMonth() + 1)).slice(-2) + ('0' + date.getDate()).slice(-2));
}

function checkIn() {
  var userQuery = new Parse.Query(Parse.User);
  userQuery.get(Parse.User.current().id, {
    success: function(user) {
      var location = new Parse.GeoPoint({
        latitude: latitude,
        longitude: longitude
      });
      user.set('location', location);
      user.set('checkIn', getDay(new Date()));
      user.save(null, {
        success: function(user) {
          var account = user.get('account');
          account.fetch({
            success: function(account) {
              $('#points').html(numberWithCommas(account.get('points')) + ' point' + (account.get('points') == 1 ? '' : 's'));
              $('#account').show();
              if (user.get('alert') != null) {
                $('#alert-content').html(user.get('alert'));
                $.mobile.changePage('#alert');
                user.set('alert', null);
                user.save();
              }
              if (window.phonegap) {
                registerForPushNotifications();      
              }
            }
          });
        }
      });
      findPosts();
    },
    error: function(user, error) {
      alert('Error: ' + error.code + ' ' + error.message);
    }
  });
}

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function updateInstallation() {
  // update the installation with the last known location for the user's device  
  var params = {
    'location': {
      '__type': 'GeoPoint',
      'latitude': latitude,
      'longitude': longitude
    },
    'badge': 0
  };
  $.ajax({
    type: 'PUT',
    url: 'https://api.parse.com/1/installations/' + window.localStorage.getItem('installationId'),
    beforeSend: function(xhr) {
      xhr.setRequestHeader('X-Parse-Application-Id', parseApplicationId);
      xhr.setRequestHeader('X-Parse-REST-API-Key', parseRestApiKey);
      xhr.setRequestHeader('Content-Type', 'application/json');
    },
    data: JSON.stringify(params),
    success: function(installation) {
      console.log('Location for installation updated.');
    },
    error: function(installation, error) {
      alert('Location update for installation failed: ' + error.message);
    },
    dataType: 'json'
  });
}

function refreshLocation () {
  navigator.geolocation.getCurrentPosition(function(position) {
    latitude = position.coords.latitude;
    longitude = position.coords.longitude;    
    // $('#post-content').css('background', 'url(http://maps.googleapis.com/maps/api/staticmap?center=' + latitude + ',' + longitude + '&zoom=10&size=1000x100&maptype=terrain&sensor=true&scale=2&key=AIzaSyB8_6TbuII6dN7-I17b6N5v4z38uLQ-1P8) center center no-repeat').css('background-size', 'cover');
    login();
  }, function(error) {
    alert('Failed to update location for device: ' + error.message);
    $.mobile.loading('hide');
    $('#refresh').addClass('loading');
  }, {
    maximumAge: 10000, 
    enableHighAccuracy: true,
    timeout: 144000
  });  
}

$('#refresh').on('click', function(e) {
  $('#refresh').addClass('loading');
  $.mobile.loading('show');
  refreshLocation();
  return false;
});

// phonegap code for push notifications
function registerForPushNotifications() {
  var pushNotification = window.plugins.pushNotification;
  pushNotification.setApplicationIconBadgeNumber(0);
  pushNotification.registerDevice({
    alert: true, badge: true, sound: true
  }, function(status) {
    var params = {
      'deviceType': 'ios',
      'deviceToken': status.deviceToken,
      'channels': ['']
    };
    $.ajax({
      type: 'POST',
      url: 'https://api.parse.com/1/installations',
      beforeSend: function(xhr) {
        xhr.setRequestHeader('X-Parse-Application-Id', parseApplicationId);
        xhr.setRequestHeader('X-Parse-REST-API-Key', parseRestApiKey);
        xhr.setRequestHeader('Content-Type', 'application/json');
      },
      data: JSON.stringify(params),
      success: function(installation) {
        window.localStorage.setItem('installationId', installation.objectId);
        updateInstallation();
        console.log('Installation registered for push notifications.');
      },
      error: function(error) {
        window.localStorage.setItem('installationId', installation.objectId);
        updateInstallation();
        console.log('Registration for push notifications failed: ' + error.message);
      },
      dataType: 'json'
    });
  });
  document.addEventListener('push-notification', function(event) {
    findPosts();
    pushNotification.setApplicationIconBadgeNumber(0);
  });
}

// phonegap code for in-app purchases
function setupInAppPurchases() {
  console.log('Setting up in-app purchases.');
  var purchaseManager = window.plugins.inAppPurchaseManager;
  var productIds = ['com.davidhendee.shout.points.10', 'com.davidhendee.shout.points.100', 'com.davidhendee.shout.points.1000'];
  console.log('Fetching available products.');
  purchaseManager.requestProductsData(productIds,
    function(products) {
      var html = '';
      for (var i = 0; i < products.length; i++) {
        var product = products[i];
        html += '<a id="' + product.id + '" class="product" data-product="' + product.id + '" href="#" data-role="button">' + product.title + ' (' + product.price + ')</a>';
      }
      $('#products').html(html);
      $('.product', '#products').on('click', function() {
        var button = $(this);
        window.plugins.inAppPurchaseManager.makePurchase(button.data('product'), 1);
      });
    },
    function(ids) {
      console.log('Invalid product ids: ' + ids.join(', '));
    }
  );
  var Transaction = Parse.Object.extend('Transaction');
  window.plugins.inAppPurchaseManager.onPurchased = function(transactionId, productId, receipt) {
    $('#store').dialog('close');
    $.mobile.loading('show');
    var transaction = new Transaction();
    transaction.set('user', Parse.User.current());
    transaction.set('transactionId', transactionId);
    transaction.set('productId', productId);
    transaction.set('receipt', receipt);
    transaction.save(null, {
      success: function(transaction) {
        console.log('Saved transaction: ' + transactionId);
        $.mobile.loading('hide');
        checkIn();
      },
      error: function(object, error) {
        console.log('Could not save transaction: ' + error.message);
      }
    });
  }
}

function wrapText(context, text, x, y, maxWidth, lineHeight) {
  var words = text.split(' ');
  var line = '';

  for (var n = 0; n < words.length; n++) {
    var testLine = line + words[n] + ' ';
    var metrics = context.measureText(testLine);
    var testWidth = metrics.width;
    if (testWidth > maxWidth) {
      context.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
    }
    else {
      line = testLine;
    }
  }
  context.fillText(line, x, y);
}

function dataURItoBlob(dataURI) {
  var byteString = atob(dataURI.split(',')[1]);
  var ab = new ArrayBuffer(byteString.length);
  var ia = new Uint8Array(ab);
  for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: 'image/png' });
}

function textToImage(text) {
  var width = 640;
  var height = 960;
  $('body').append('<canvas id="canvas" width="' + width + '" height="' + height + '" style="display: none"></canvas>');
  var canvas = document.getElementById('canvas');
  var context = canvas.getContext('2d');
  var maxWidth = 540;
  var lineHeight = 60;
  var x = (canvas.width - maxWidth) / 2;
  var y = 120;

  context.fillStyle = '#000000';
  context.fillRect(0, 0, 640, 960);

  context.fillStyle = '#ffffff';
  context.font = 'bold 50px helvetica';
  wrapText(context, text, x, y, maxWidth, lineHeight);

  context.font = 'bold 18px helvetica';
  context.fillText('Download Shout from the app store.', 50, 880);

  var blob = dataURItoBlob(canvas.toDataURL('image/png'));

  return blob;
}

$('#share-facebook').on('click', function() {
  var shareContent = $('#share-content');
  console.log(shareContent.data('image'));
  share(shareContent.text(), shareContent.data('image'));
});

function shareToFacebook(text, image) {
  var params = {
    method: 'feed',
    name: 'Shout',
    link: 'http://www.shout.com',
    picture: image,
    caption: text,
    description: 'Download Shout today.'
  };
  FB.ui(params, function(obj) { 
    console.log(obj);
  });
}

function share(text, image) {
  FB.getLoginStatus(function(response) {
    if (response.status == 'connected') {
      shareToFacebook(text, image);
    } else {
      FB.login(function(response) {
        if (response.session) {
          shareToFacebook(text, image);
        } else {
          alert('You must login to Facebook to share posts.');
        }
      },
      { 
        scope: email
      });
    }
  });
}

$(function() {
  $.mobile.loading('show');
  window.phonegap = document.URL.indexOf('http://') == -1;
  if (window.phonegap) {
    document.addEventListener('deviceready', function onDeviceReady() {
      refreshLocation();
      setupInAppPurchases();
      FB.init({ 
        appId: '460489950704243', 
        nativeInterface: CDV.FB, 
        useCachedDialogs: false 
      });
    });
    document.addEventListener('resume', function onResume() {
      refreshLocation();
    });    
  } else {
    refreshLocation();
    // todo: get this working on web for easier testing(?)
    FB.init({ 
      appId: '460489950704243'
    });
  }
});