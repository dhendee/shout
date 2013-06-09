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
          // todo: placeholder image for failed image saves?
          var image = post.get('image') ? post.get('image')._url : '';
          list.append('<li data-image="' + image + '"><span class="message">' + post.get('message') + ' </span><small><time class="timeago" datetime="' + createdAt + '">' + createdAt + '</time>, ' + distance +  '<a class="actions btn btn-small" href="#">&hellip;</a></small></li>');
        }
        list.find('li:not(#template) .actions').fastClick(function() {
          var item = $(this).closest('li');
          var text = $('.message', item).text();
          var image = item.data('image');
          var shareFacebook = $('#share-facebook');
          shareFacebook.data('message', text);
          shareFacebook.data('image', image);
          var shareTwitter = $('#share-twitter');
          shareTwitter.fastClick(function() {
            $('.modal').modal('hide');
            track('share', 'twitter', text);
            window.open('http://twitter.com/share?text=' + encodeURIComponent(text) + '&via=schowt&url=http://schowt.com', '_system');
          });
          var sharePinterest = $('#share-pinterest');
          sharePinterest.fastClick(function() {
            $('.modal').modal('hide');
            track('share', 'pinterest', text);
            window.open('http://pinterest.com/pin/create/button/?url=http://schowt.com&description=' + encodeURIComponent('Heard on Schowt: ' + text) + '&media=' + image, '_system');
          });
          var flag = $('#flag');
          flag.data('post', post.id);
          $('#actions').modal('show');
          return false;
        });
        $('time.timeago').timeago();
      }
      $('#refresh').removeClass('loading');
    },
    error: function(error) {
      alert('Error finding posts: ' + error.code + ' ' + error.message);
      $('#refresh').removeClass('loading');
    }
  });
}

$('#message').fastClick(function() {
  window.scrollTo(0, 0);
  $('#post-content').addClass('open');
  $('#message').trigger('focus');
  return false;
});

$('#message').on('keyup', function() {
  track('post', 'compose');
});

function setMapImage(val) {
  var zoom;
  val = parseInt(val, 10);
  switch (val) {
    case 1:
      zoom = 15;
      break;
    case 10:
      zoom = 11;
      break;
    case 100:
      zoom = 5;
      break;
    default:
      zoom = 1;
  }
  // temporarily switching this to always be 10
  // var url = 'http://maps.googleapis.com/maps/api/staticmap?center=' + latitude + ',' + longitude + '&zoom=' + zoom + '&size=640x640&maptype=terrain&sensor=true&scale=2&key=AIzaSyB8_6TbuII6dN7-I17b6N5v4z38uLQ-1P8';
  var url = 'http://maps.googleapis.com/maps/api/staticmap?center=' + latitude + ',' + longitude + '&zoom=12&size=640x640&maptype=terrain&sensor=true&scale=2&key=AIzaSyB8_6TbuII6dN7-I17b6N5v4z38uLQ-1P8';
  $('#post-content').css('background-image', 'url(' + url + ')').css('background-size', 'cover');
}

$('#distance').on('change', function() {
  var field = $(this);
  setMapImage(field.val());
  $('#message').trigger('focus');
});

function closeMessageContent() {
  $('#message').val('');
  $('#post-content').removeClass('open');
}

$('#posts-content, #header, #refresh, #points').on('click', function() {
  closeMessageContent();
  return false;
});  

$('#submit-post').on('click', function() {
  var message = $('#message', 'form#post').val();
  if (message == '') {
    return false;
  } else {
    return true;
  }
});

$('#message', 'form#post').on('blur', function() {
  var message = $('#message', 'form#post').val();
  if (message == '') {
    closeMessageContent();
  }
});

$('form#post').on('submit', function() {
  var form = $(this);
  $('#submit-post', form).attr('disabled', true);
  var post = new Post();
  var location = new Parse.GeoPoint({
    latitude: latitude, 
    longitude: longitude
  });
  var messageField = $('#message', form);
  var message = messageField.val();
  closeMessageContent();
  // temporarily hardcoding distance to 1
  var distance = '1';
  messageField.val('');
  // create a mock of the layout to get the height for the canvas...might be a better way to dynamically size it.
  $('#posts').prepend('<li id="template"><p class="message">' + message + '</p><small class="info"><time>less than a minute ago</time>, within a mile<a class="actions btn btn-small" href="#">&hellip;</a></small></li>');
  post.set('user', Parse.User.current());
  post.set('location', location);
  post.set('message', message);
  post.set('distance', distance);
  track('post', 'submit', message);
  post.save(null, {
    success: function(post) {
      var imageBlob = textToImage(message);
      $.ajax({
        type: "POST",
        beforeSend: function(request) {
          request.setRequestHeader('X-Parse-Application-Id', parseApplicationId);
          request.setRequestHeader('X-Parse-REST-API-Key', parseRestApiKey);
          request.setRequestHeader('Content-Type', 'image/png');
        },
        url: 'https://api.parse.com/1/files/' + post.id + '.png',
        data: imageBlob,
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
              console.log('Post image saved.');
              checkIn();
              $('#submit-post', form).attr('disabled', false);
              $('#canvas').remove();
              track('post', 'create', post.get('message'));
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
    error: function(object, error) {
      alert('Post save failed: ' + error.message);
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
          alert('Error logging in: ' + error.code + ' ' + error.message);
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
          alert('Error signing up: ' + error.code + ' ' + error.message);
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
              // temporarily changing 'pionts' to 'shouts'
              // $('#points').html(numberWithCommas(account.get('points')) + ' pt' + (account.get('points') == 1 ? '' : 's')).show();
              $('#points').html(numberWithCommas(account.get('points'))).show();
              if (user.get('alert') != null) {
                $('#alert-content').html(user.get('alert'));
                $('#alert').modal('show');
                user.set('alert', null);
                user.save();
              }
              if (window.phonegap) {
                registerForPushNotifications();      
              }
              track('user', 'checkin', Parse.User.current());
            }
          });
        }
      });
      findPosts();
    },
    error: function(user, error) {
      // todo: this fails a lot on resume, so we should figure out why.
      // but it's not hurting things overall and is worse as an alert.
      // alert('Error getting user: ' + error.code + ' ' + error.message);
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
  closeMessageContent();
  navigator.geolocation.getCurrentPosition(function(position) {
    latitude = position.coords.latitude;
    longitude = position.coords.longitude; 
    setMapImage(1);   
    login();
  }, function(error) {
    alert('Failed to update location for device: ' + error.message);
    $('#refresh').addClass('loading');
  }, {
    maximumAge: 10000, 
    enableHighAccuracy: true,
    timeout: 144000
  });  
}

$('#refresh').fastClick(function(e) {
  $('#refresh').addClass('loading');
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
  var list = $('#products');
  for (var i = 0; i < productIds.length; i++) {
    window.plugins.inAppPurchaseManager.requestProductData(productIds[i], function(result) {
      list.append('<a id="' + result.id + '" class="btn btn-primary product" data-product="' + result.id + '" href="#" data-role="button">' + result.title + ' (' + result.price + ')</a>');
      $('.product[data-product="' + result.id + '"]').fastClick(function() {
        var button = $(this);
        window.plugins.inAppPurchaseManager.makePurchase(button.data('product'), 1);
        return false;
      });
    }, 
    function(id) {
      console.log("Invalid product id: " + result);
    }); 
  }
  var Transaction = Parse.Object.extend('Transaction');
  window.plugins.inAppPurchaseManager.onPurchased = function(transactionId, productId, receipt) {
    $('#store, #modal-background').hide();
    $('#refresh').addClass('loading');
    var transaction = new Transaction();
    transaction.set('user', Parse.User.current());
    transaction.set('transactionId', transactionId);
    transaction.set('productId', productId);
    transaction.set('receipt', receipt);
    transaction.save(null, {
      success: function(transaction) {
        console.log('Saved transaction: ' + transactionId);
        $('#refresh').removeClass('loading');
        checkIn();
        track('products', 'purchase', productId);
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
  var width = 600;
  var template = $('#template'); // created when post is saved for immediate feedback
  var height = $('.message', template).outerHeight() * 2;
  $('body').append('<canvas id="canvas" width="' + width + '" height="' + height + '" style="display: none"></canvas>');
  var canvas = document.getElementById('canvas');
  var context = canvas.getContext('2d');
  var maxWidth = 540;
  var lineHeight = 64;
  var x = (canvas.width - maxWidth) / 2;
  var y = 80;

  context.fillStyle = '#2d2d2d';
  context.fillRect(0, 0, width, height);

  context.fillStyle = '#ffffff';
  context.font = 'bold 60px "Avant Garde Bold"';
  wrapText(context, text.toUpperCase(), x, y, maxWidth, lineHeight);

  drawLogo(context, canvas.width, canvas.height);
  return dataURItoBlob(canvas.toDataURL('image/png'));
}

$('#share-facebook').fastClick(function() {  
  var link = $(this);
  var text = link.data('message');
  var image = link.data('image');
  var params = {
    method: 'feed',
    link: 'http://www.schowt.com',
    picture: image,
    name: 'Schowt',
    caption: 'Heard on Schowt:',
    description: text
  };
  FB.ui(params, function(obj) { 
    console.log(obj);
  });
  track('share', 'facebook', text);
  return true;
});

$('#flag').fastClick(function() {
  $('#refresh').addClass('loading');
  $('.modal').modal('hide');
  var link = $(this);
  var postQuery = new Parse.Query(Post);
  postQuery.get(link.data('post'), {
    success: function(post) {
      var flags = post.relation('flags');
      flags.add(Parse.User.current());
      post.save(null, {
        success: function(post) {
          $('#refresh').removeClass('loading');
          notify('We\'ll look into it. Thank\'s for keeping Schowt friendly.');
        },
        error: function(object, error) {
          alert('Could not update post: ' + error.message);
        }
      });
      track('post', 'flag', post.get('message'));
      return true;
    },
    error: function(object, error) {
      alert('Could not find post: ' + error.message);
    }
  });
});

$('#points').fastClick(function() {
  track('products', 'browse');
  $('#store').modal('show');
});

$.fn.extend({
  modal: function(command) {
    return this.each(function() {
      var el = $(this);
      var background = $('#modal-background');
      if (command == 'show') {
        var centeredTop = Math.round(($(window).height() - $(this).outerHeight()) / 2);
        el.data('top', el.css('top'));
        el.css('top', centeredTop);
        background.addClass('show');
        el.addClass('show');
      } else {
        background.removeClass('show');        
        el.css('top', el.data('top'));
        el.removeClass('show');
      }
    });
  }
});

$('.btn-close').fastClick(function() {
  $('.modal').modal('hide');
  return false;
});

function notify(text) {
  $('#alert-content').html(text);
  $('#alert').modal('show');
}

function track(category, action, label) {
  _gaq.push(['_trackEvent', category, action, label != undefined ? label : null]);
}

$(function() {
  window.phonegap = document.URL.indexOf('http://') == -1;
  if (window.phonegap) {
    document.addEventListener('deviceready', function onDeviceReady() {
      refreshLocation();
      FB.init({
        appId: '460489950704243', 
        nativeInterface: CDV.FB, 
        useCachedDialogs: false 
      });
      setupInAppPurchases();
      // var toolbar = cordova.require('cordova/plugin/keyboard_toolbar_remover');
      // toolbar.hide();
    });
    document.addEventListener('resume', function onResume() {
      refreshLocation();
    });    
    document.addEventListener('touchstart', function() { }, false);
  } else {
    refreshLocation();
  }
});