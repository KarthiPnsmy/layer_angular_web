/* global layer */
'use strict';

document.addEventListener('DOMContentLoaded', function() {
  /**
   * Hardcoded user identities
   */
  var USERS = [
    'Alice',
    'Bob',
    'Robot',
    'Kabali',
    'Sams'
  ];
    
  var sampleIdentities = {
    '1': 'User 1',
    '2': 'User 2',
    '3': 'User 3',
    '4': 'User 4',
    '5': 'User 5'
  };
    
  var getIdentityDisplayName = function(userId){
      return sampleIdentities[userId] || 'User ' + userId;
  };

  /**
   * layerSample global utility
   *
   * @param {String}    appId - Layer Staging Application ID
   * @param {Array}     users - Hard-coded users Array
   * @param {String}    user - Logged in user
   * @param {Function}  challenge - Layer Client challenge function
   */
  window.layerSample = {
    appId: null,
    users: USERS,
    user: USERS[0],
    identities : sampleIdentities,
    getDisplayName : getIdentityDisplayName, 
    challenge: function(nonce, callback) {
        //console.log('challenge: nonce = '+nonce);
        //console.log('challenge: window.layerSample.appId = '+window.layerSample.appId);
        //console.log('challenge: window.layerSample.user = '+window.layerSample.user); 
    
    var id = window.layerSample.appId.replace(/^.*\//, '');
    layer.xhr({
      url: 'https://layer-identity-provider.herokuapp.com/apps/' + id + '/identities',
      headers: {
        'Content-type': 'application/json',
        'Accept': 'application/json'
      },
      method: 'POST',
      data: {
        name: window.layerSample.user,
        nonce: nonce
      }
    }, function(result) {
      var data = result.data;
          var userArr = [];
          data.atlas_identities.forEach(function(item) {
              sampleIdentities[item.id] = item.name;
              userArr.push(item.name);
              //console.log('user id: '+item.id+", user name: "+item.name);
          });
          window.layerSample.identities = sampleIdentities;
          window.layerSample.users = userArr;
          console.log('window.layerSample.identities: = '+JSON.stringify(window.layerSample.identities));
          callback(data.identity_token);
        
          //Cleanup identity dialog
          var node = document.getElementById('identity');
          node.parentNode.removeChild(node);
    });
        
        /*
      layer.xhr({
          url: 'https://layer-identity-provider.herokuapp.com/identity_tokens',
          //url: 'https://layer-identity-provider.herokuapp.com/apps/b6846d1e-1d93-11e6-9bf0-070002002f7c/identities',
        headers: {
          'X_LAYER_APP_ID': window.layerSample.appId,
          'Content-type': 'application/json',
          'Accept': 'application/json'
        },
        method: 'POST',
        data: {
          nonce: nonce,
          app_id: window.layerSample.appId,
          user_id: window.layerSample.user
        }
      }, function(res) {
          console.log('challenge: result 11 = '+res);
          console.log('challenge: result string = '+JSON.stringify(res));
        if (res.success) {
          console.log('challenge: ok');

          callback(res.data.identity_token);

          // Cleanup identity dialog
          var node = document.getElementById('identity');
          node.parentNode.removeChild(node);
        } else {
          console.error('challenge error: ', res.data);
        }
      });
      */
    },
    dateFormat: function(date) {
      var now = new Date();
      if (!date) return now.toLocaleDateString();

      if (date.toLocaleDateString() === now.toLocaleDateString()) return date.toLocaleTimeString();
      else return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }
  };

  /**
   * Dirty HTML dialog injection
   */
  var div = document.createElement('div');
  div.innerHTML += '<img src="http://static.layer.com/logo-only-blue.png" />';
  div.innerHTML += '<h1>Welcome to Layer sample app!</h1>';
  div.innerHTML += '<p>1. Enter your Staging Application ID:</p>';

//  div.innerHTML += '<input name="appid" type="text" placeholder="Staging Application ID" value="' + (localStorage.layerAppId || '') + '" />';
  div.innerHTML += '<input name="appid" type="text" placeholder="Staging Application ID" value="layer:///apps/staging/b6846d1e-1d93-11e6-9bf0-070002002f7c" />';
  div.innerHTML += '<p>2. Login as:</p>';

//  for (var i = 0; i < USERS.length; i++) {
//    var checked = i === 0 ? 'checked' : '';
//    div.innerHTML += '<label><input type="radio" name="user" value="' + USERS[i] + '" ' + checked + '/>' + USERS[i] + '</label>';
//  }
  div.innerHTML += '<input name="userid" type="text" placeholder="User Name" value="Admin1" />';
  var button = document.createElement('button');
  button.appendChild(document.createTextNode('Login'));

  div.appendChild(button);

  var container = document.createElement('div');
  container.setAttribute('id', 'identity');
  container.appendChild(div);
  document.body.insertBefore(container, document.querySelectorAll('.main-app')[0]);

  button.addEventListener('click', function() {
    var appId = div.children.appid.value;
    if (!appId) return alert('Please enter your Staging Application ID');

    button.innerHTML = '<i class="fa fa-spinner fa-pulse"></i>';

    window.layerSample.appId = appId;
    try {
       localStorage.layerAppId = appId;
    } catch(e) {}

      /*
    var radios = div.getElementsByTagName('input');
    for (var i = 0; i < radios.length; i++) {
      if (radios[i].type === 'radio' && radios[i].checked) {
        window.layerSample.user = radios[i].value;
        break;
      }
    }
    */
      
    window.layerSample.user = div.children.userid.value;
    console.log("window.layerSample.user = "+window.layerSample.user);

    window.postMessage('layer:identity', '*');
  });
});
