/* global angular layer */
'use strict';

var controllers = angular.module('conversationPanelControllers', []);
var videoStream = null;
/**
 * The Conversation Controller manages:
 *
 * * An editable titlebar
 * * A scrollable/pagable list of Messages
 * * A SendPanel for composing and sending Messages
 */
controllers.controller('conversationCtrl', ['$scope','$sce', function($scope, $sce) {
  $scope.editingTitle = false;
  var typingListener = $scope.appCtrlState.client.createTypingListener(
      document.querySelectorAll('.message-textarea')[0]);

  /**
   * On typing a message and hitting ENTER, the send method is called.
   * $scope.chatCtrlState.currentConversation is a basic object; we use it to get the
   * Conversation instance and use the instance to interact with Layer Services
   * for sending the Message.
   *
   * See http://static.layer.com/sdk/docs/#!/api/layer.Message
   */
  $scope.send = function() {
    var conversationInstance = $scope.appCtrlState.client.getConversation($scope.chatCtrlState.currentConversation.id);
      console.log('conversationInstance id is = '+$scope.chatCtrlState.currentConversation.id);
    if (conversationInstance) {
      conversationInstance.createMessage($scope.sendText).send();
      console.log('createMessage is = '+$scope.sendText);
      $scope.sendText = '';
    }
  };
    
 function sendAudioMessage(audioBlob){
    var conversationInstance = $scope.appCtrlState.client.getConversation($scope.chatCtrlState.currentConversation.id);
    console.log('sendAudioMessage conversationInstance id is = '+$scope.chatCtrlState.currentConversation.id);
    if (conversationInstance) {
        var infoObject = {};
        infoObject.messageType = "audio";
        infoObject.duration = "99:99";
        infoObject.fileName = "9999999999";
        var messagePart1 = new layer.MessagePart({
            body: infoObject,
            mimeType: 'application/json+audioSize'
        });
        
        var messagePart2 = new layer.MessagePart({
            body: audioBlob,
            mimeType: 'audio/3gp'
        });

        var message = conversationInstance.createMessage({ parts: [messagePart2, messagePart1] });
        message.send();
        $scope.sendText = '';
    };
        
  }

  /**
   * Any time the currentConversation has changed, monitor the new conversation
   * for changes to its properties/metadata and rerender whenever these change.
   */
  $scope.$watch('chatCtrlState.currentConversation', function(newValue, oldValue) {
    var oldId = oldValue ? oldValue.id : '';
    var newId = newValue ? newValue.id : '';
    if (oldId !== newId) {
      if (newValue) {
        var conversation = $scope.appCtrlState.client.getConversation(newId);

        // Update what Conversation typing indicators are sent as when our user is typing
        typingListener.setConversation(conversation);


        // Listens for all changes to this Conversation's properties;
        // Primarily for rendering changes to metadata.title
        if (conversation) {
          conversation.on('conversations:change', function() {
            $scope.chatCtrlState.currentConversation = conversation.toObject();
            $scope.$digest();
          }, this);
        }
      }

      // Stop listening to the old Conversation's property changes.
      if (oldValue) {
        var oldConversation = $scope.appCtrlState.client.getConversation(oldValue.id);
        if (oldConversation) oldConversation.off(null, null, this);
      }
    }
  }, true);

  /**
   * User is now editting or done editting the title of the Conversation
   */
  $scope.setEditTitle = function(state) {
    $scope.editingTitle = state;
  };

  /**
   * Atart Audio Recording
   */
  $scope.startAudioRecording = function() {
      // Test browser support
      //window.navigator = window.navigator || {};
      navigator.getUserMedia = navigator.getUserMedia       ||
                               navigator.webkitGetUserMedia ||
                               navigator.mozGetUserMedia    ||
                               null;
      
      console.log("navigator.getUserMedia = "+navigator.getUserMedia);
      
      var createSrc = window.URL ? window.URL.createObjectURL : function(stream) {return stream;};
      console.log("createSrc = "+createSrc);
        
      // Opera <= 12.16 support video only.
      var audioContext = window.AudioContext       ||
                           window.webkitAudioContext ||
                           null;
      
      console.log("audioContext = "+audioContext);
      
        // Capture user's audio and video source
          navigator.getUserMedia({
            video: true,
            audio: true
          },
          function(stream) {
            videoStream = stream;
            //Stream the data
            console.log("stream = "+stream);
            var recordAudio = RecordRTC(stream, {type: 'audio'});

            recordAudio.startRecording();
              setTimeout(function(){
                recordAudio.stopRecording(function() {
                    var blob = recordAudio.getBlob();
                    console.log("recordAudio.getBlob() = "+blob);
                    sendAudioMessage(blob);
                });
              }, 4000)
          },
          function(error) {
            console.log("Video capture error: "+ error.code);
          });
  };
    

  /**
   * Saving the title is done by updating the Conversation's metadata.
   * See http://static.layer.com/sdk/docs/#!/api/layer.Conversation-method-setMetadataProperties
   */
  $scope.saveTitle = function() {
    var conversationInstance = $scope.appCtrlState.client.getConversation($scope.chatCtrlState.currentConversation.id);
    if (conversationInstance) {
      conversationInstance.setMetadataProperties({
        title: $scope.chatCtrlState.currentConversation.metadata.title
      });
    }
    $scope.editingTitle = false;
  };
}]);

/**
 * The Typing Indicator Controller renders if anyone is typing
 */
controllers.controller('typingIndicatorCtrl', function($scope) {
  $scope.typing = [];
  $scope.paused = [];

  // Insure that when we change conversations we don't carry
  // typing state over from last Conversation
  $scope.$watch('chatCtrlState.currentConversation', function() {
    $scope.typing = [];
    $scope.paused = [];
  });

  // Any time the typing indicators change for this conversation
  // update our state and rerender.
  // See http://static.layer.com/sdk/docs/#!/api/layer.Client-event-typing-indicator-change
  $scope.appCtrlState.client.on('typing-indicator-change', function(evt) {
    if (evt.conversationId === $scope.chatCtrlState.currentConversation.id) {
      $scope.typing = evt.typing;
      $scope.paused = evt.paused;
      $scope.$digest();
    }
  });

  // Render a typing indicator message
  $scope.getText = function() {
    var users = $scope.typing;
//    if (users && users.length > 0) {
//      return users.length === 1 ? users[0] + ' is typing' : users.join(', ') + ' are typing';
//    } else {
//      return '';
//    }
      
    if (users && users.length > 0) {
        if(users.length === 1){
            return window.layerSample.getDisplayName(users[0])+ ' is typing';
        } else {
            users.map(function(userId) {
                window.layerSample.getDisplayName(userId);
            }).join(', ')+" are typing";
        }
    } else {
      return '';
    }
  };
});

/**
 * The Message List Controller renders a list of Messages,
 * and provides pagination
 */
controllers.controller('messageListCtrl', ['$scope', '$sce', function ($scope, $sce) {
  // Store all message data here
  $scope.data = [];

  // Property prevents paging; useful if we are mid-pagination operation.
  $scope.disablePaging = true;

  // Create the Messages Query
  $scope.query = $scope.appCtrlState.client.createQuery({
    model: layer.Query.Message,
    dataType: 'object',
    paginationWindow: 30
  });

  /**
   * Whenever new messages arrive:
   *
   * * Flag them as read which will tell the server that they are read
   * * Append the results to our data
   *
   * See http://static.layer.com/sdk/docs/#!/api/layer.Query for
   * more information on query change events.
   */
  $scope.query.on('change', function(evt) {
    // Ignore reset events unless we already have data
    if (evt.type !== 'reset' || $scope.data.length) {

      // For any change type, get a copy of the query's data
      // and reverse its order
      var data = $scope.query.data.concat([]);
      $scope.data = data.reverse();

      // For every message in the data results, get the message
      // instance and set isRead to true (side-effects notify server its read)
      data.map(function(item) {
        return $scope.appCtrlState.client.getMessage(item.id);
      }).forEach(function(m) {
        m.isRead = true;
      });

      // After a short delay, reenable paging
      window.setTimeout(function() {
        if (!$scope.query.isFiring) {
          $scope.disablePaging = false;
        }
      }, 500);
        
        console.log("$scope.data ::: "+JSON.stringify($scope.data));

      // Any time the query's data changes, rerender.
      if ($scope.$$phase !== '$digest') $scope.$digest();
    }
  });

  // Any time currentConversation points to a new Conversation,
  // Update our query to get that new Conversation's messages.
  // This will trigger a `change` event of type `reset` event followed by a request to the server
  // and then a `change` event of type `data`.
  $scope.$watch('chatCtrlState.currentConversation', function(newValue) {
    $scope.query.update({
      predicate: newValue ? "conversation.id = '" + newValue.id + "'" : null
    });
    $scope.disablePaging = $scope.query.isFiring;
  });

  /**
   * Get initials from sender
   *
   * @method
   * @param  {Object} message - Message object or instance
   * @return {string} - User's display name
   */
  $scope.getSenderInitials = function(message) {
    var name = message.sender.userId || 'Unknown';
    return window.layerSample.getDisplayName(name).substr(0, 2).toUpperCase();
      //return name.substr(0, 2).toUpperCase();
  };
    
  /**
   * Get display name from sender
   *
   * @method
   * @param  {Object} message - Message object or instance 
   * @return {string} - User's display name
   */
  $scope.getSenderDisplayName = function(message) {
    var userId = message.sender.userId || 'Unknown';
    return window.layerSample.getDisplayName(userId);
  };
    
  /**
   * Render message view
   *
   * @method
   * @param  {Object} message - Message object or instance 
   */
  $scope.renderMessage = function(message) {
        if(message.parts.length > 1){

            if(message.parts[0].mimeType.indexOf("audio") > -1){
                return true;
            }
        } else {
            return false;
        }
  };
    
  /**
   * Render text message view
   *
   * @method
   * @param  {Object} message - Message object or instance 
   */
  $scope.renderTextMessage = function(message) {
        if(message.parts.length > 1){
            if(message.parts[0].mimeType.indexOf("audio") > -1){
                return false;
            }
        } else {
            return true;
        }
  };
    
    $scope.audioUrl = function(message){
        return $sce.trustAsResourceUrl(message.parts[0].url);
    };

  /**
   * Get the message's read/delivered status.  For this
   * simple example we ignore delivered (see `message.deliveryStatus`).
   *
   * See http://static.layer.com/sdk/docs/#!/api/layer.Message-property-readStatus
   *
   * @method
   * @param  {Object} message - Message object or instance
   * @return {string} - Message to display in the status node
   */
  $scope.getMessageStatus = function(message) {
    switch (message.readStatus) {
      case 'NONE':
        return 'unread';
      case 'SOME':
        return 'read by some';
      case 'ALL':
        return 'read';
    }
  };

  /**
   * Get the message sentAt string in a nice renderable format.
   *
   * See http://static.layer.com/sdk/docs/#!/api/layer.Message-property-sentAt
   *
   * @method
   * @param  {Object} message - Message object or instance
   * @return {string} - Message to display in the sentAt node
   */
  $scope.getMessageDate = function(message) {
    return window.layerSample.dateFormat(message.sentAt);
  };

  /**
   * nextPage() is called by the infinite scroller each
   * time it wants another page of messages from the server
   * to render.
   */
  $scope.nextPage = function() {
    if (!$scope.query.isFiring) {
      $scope.query.update({
        paginationWindow: $scope.query.paginationWindow + 30
      });
    }
  };
}]);
