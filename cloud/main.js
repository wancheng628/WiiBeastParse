var _ = require('underscore');
 
Parse.Cloud.define("searchWithParams", function(request, response){
     
    var params = request.params;
     
    //response.error(params);
     
    searchByGym(params).then(function(gyms){
        return searchByHomeGym(gyms, params).then(function(homeGymUsers){
            return searchByWorkout(homeGymUsers, params).then(function(workoutUsers){
                return  searchByAvailability(workoutUsers, params).then(function(availabilityUsers) {
                    return searchUsers(availabilityUsers, params).then(function(users){
                         
                        if (users == null){
                            response.error("No Results");
                        } else {
                            response.success(users);
                        }
                    });
                });
            });
        });
    });
     
});
 
Parse.Cloud.define("searchForUsers", function(request, response){
    searchByGym(request.params, function(gyms){
        return searchByHomeGym(gyms, request.params, function(homeGymUsers){
            return searchByWorkout(homeGymUsers, request.params, function(workoutUsers){
                return searchByAvailability(workoutUsers, request.params, function(availabilityUsers){
                    return searchUsers(availabilityUsers, request.params, function(users){
                        if (users == null || users.length == 0){
                            response.error("No Results");
                        } 
                         
                        if (users == true) {
                            response.error("Found");
                        }
                         
                        else {
                            response.success(users);
                        }
                    });
                });
            });
        });
    });
});
 
function searchByGym(params) {
     
    var location = params.location;
    var name = params.name;
    var city = params.city;
    var zip = params.zip;
    var gymQuery = new Parse.Query("Gym");
     
    if (!location && !name && !city && !zip){
        return Parse.Promise.as(null);
    }
     
    if (zip){
        gymQuery.equalTo("zip", zip);
    }
     
    if (city){
        gymQuery.equalTo("city", city);
    }
     
    if (name){
        gymQuery.equalTo("name", name);
    }
     
    if (location){
        var loc = new Parse.GeoPoint(location.lat, location.lng);
        gymQuery.equalTo("location", location);
    }
     
    return gymQuery.find().then(function(gyms){
        if (gyms.length > 0){
            return Parse.Promise.as(null);
        } else {
            return Parse.Promise.as(null);
        }
    }, function(error){
        return Parse.Promise.as(null);
    });
}
 
function searchByHomeGym(gyms, params) {
     
    if (!gyms){
        return Parse.Promise.as(null);
    }
     
    var homeGymQuery = new Parse.Query(Parse.User);
    homeGymQuery.containedIn("gyms", gyms);
     
    return homeGymQuery.find().then(function(homeGymUsers){
        if (homeGymUsers.length > 0){
            return Parse.Promise.as(homeGymUsers);
        } else {
            return Parse.Promise.as(null);
        }
    }, function(error){
        return Parse.Promise.as(null);
    });
}
 
function searchByWorkout(homeGymUsers, params) {
     
    var activity = params.activity;
    var workoutQuery = new Parse.Query("Workout");
    workoutQuery.include("user");
    workoutQuery.include("gym");
         
    if (!activity){
        if (homeGymUsers){
            return Parse.Promise.as(homeGymUsers);
        }   
        return Parse.Promise.as(null);
    }
         
    if (homeGymUsers){
        workoutQuery.containedIn("user", homeGymUsers);
    }
         
    if (activity){
        workoutQuery.equalTo("activity", activity);
    }
         
    return workoutQuery.find().then(function(workouts){
         
        if (workouts.length > 0){
             
            var workoutUsers =  _.map(workouts, function(obj){
                return obj.get("user");
            });
             
            return Parse.Promise.as(workoutUsers);
         
        } else {
            return Parse.Promise.as(null);
        }
    }, function(error) {
        return Parse.Promise.as(null);
    });
}
 
function searchByAvailability(workoutUsers, params) {
     
    var startTime = params.startTime;
    var endTime = params.endTime;
    var weekdays = params.weekdays;
    var timeQuery = new Parse.Query("Availability");
    timeQuery.include("user");
         
    if (!startTime && !endTime && !weekdays){
        if (workoutUsers){
            return Parse.Promise.as(workoutUsers);
        }
        return Parse.Promise.as(null);
    }
         
    if (workoutUsers){
        timeQuery.containedIn("user", workoutUsers);
    }
         
    if (startTime){
        timeQuery.equalTo("startTime", startTime);
    }
         
    if (endTime){
        timeQuery.equalTo("endTime", endTime);
    }
         
    if (weekdays){
        timeQuery.containedIn("weekday", weekdays);
    }
         
    return timeQuery.find().then(function(timeSlots){
        if (timeSlots.length > 0){
             
            var timeSlotUsers = _.map(timeSlots, function(obj){
                return obj.get("user");
            });
             
            return Parse.Promise.as(timeSlotUsers);
             
        } else {
            return Parse.Promise.as(null);
        }
    }, function(error) {
        return Parse.Promise.as(null);
    }); 
}
 
function searchUsers(availabilityUsers, params) {
     
    if (availabilityUsers) {
         
        if (params.gender){
             
            var genderFiltered = _.filter(availabilityUsers, function(user){
                return params.gender.indexOf(user.get("gender")) > -1;
            });
             
            if (genderFiltered.length == 0) {
                return Parse.Promise.as(null);
            }
             
            availabilityUsers = genderFiltered;
        }
         
        if (params.minAge) {
             
            var date = new Date();
            var currentYear = date.getFullYear();
            var ageFiltered = _.filter(availabilityUsers, function(users){
                return parseInt(user.get("birthday")) <= currentYear;
            });
             
            if (ageFiltered.length == 0) {
                return Parse.Promise.as(null);
            } 
             
            availabilityUsers = ageFiltered;
        }
         
        if (params.maxAge) {
             
            var date = new Date();
            var currentYear = date.getFullYear();
            var ageFiltered = _.filter(availabilityUsers, function(users){
                return parseInt(user.get("birthday")) >= currentYear;
            });
             
            if (ageFiltered.length == 0) {
                return Parse.Promise.as(null);
            } 
             
            availabilityUsers = ageFiltered;
        }
         
        if (availabilityUsers.length > 0) {
             
            var uniqueUsers = [];
             
            for (var i=0; i<availabilityUsers.length; i++){
                var seen = false;
                for (var j=0; j<uniqueUsers.length; j++){
                    if (uniqueUsers[j].id == availabilityUsers[i].id){
                        seen = true;
                    }   
                }
                if (seen == false) { uniqueUsers.push(availabilityUsers[i]); }
            }
             
            return Parse.Promise.as(uniqueUsers);
             
        } else {
            return Parse.Promise.as(null);
        }
             
    } else {
             
        if (!params.gender && !params.minAge && !params.maxAge){
            return Parse.Promise.as(null);
        }
             
        var userQuery = new Parse.Query(Parse.User);
             
        if (params.gender){
            userQuery.containedIn("gender", params.gender);
        }
             
        if (params.minAge){
            var date = new Date();
            var year = date.getFullYear() - params.minAge;
            userQuery.lessThanOrEqualTo("birthday", year);
        }
             
        if (params.maxAge){
            var date = new Date();
            var year = date.getFullYear() - params.maxAge;
            userQuery.greaterThanOrEqualTo("birthday", year);
        }
             
        return userQuery.find().then(function(users){
            if (users.length > 0){
                return Parse.Promise.as(users);
            } else {
                return Parse.Promise.as(null);
            }
        }, function(error){
            return Parse.Promise.as(null);
        });
         
    }
}
 
function searchResults(users, params, response) {
     
    if (!users || users.length == 0){
        response.error("No Users");
    } else {
        response.success(users);
    }
}
 
Parse.Cloud.define("saveGym", function(request, response) {
     
    var query = new Parse.Query("Gym");
    query.equalTo("location", request.params.location);
    query.first().then(function(existingObject) {
        if (existingObject){
            response.success(existingObject);
        } else {
            var GymClass = new Parse.Object.extend("Gym");
            var gym = new GymClass();
            gym.set("location", request.params.location);
            gym.set("name", request.params.name);
            gym.set("address", request.params.address);
            gym.set("city", request.params.city);
            gym.set("state", request.params.state);
            gym.set("zip", request.params.zip);
            gym.save(null,{
              success:function(gym) { 
                response.success(gym);
              },
              error:function(error) {
                response.error(error);
              }
            });
        }
    });
});
 
Parse.Cloud.beforeSave("Gym", function(request, response) {
     
    var query = new Parse.Query("Gym");
    query.equalTo("location", request.object.get("location"));
    query.first().then(function(existingObject) {
        if (existingObject){
            response.success(existingObject);
            /*existingObject.save(null, {
                success: function(){
                    response.success();
                },
                error: function(error){
                    response.error(error);
                }
            });*/
        } else {
            response.success();
        }
    });
});
 
/*Parse.Cloud.beforeSave("Gym", function(request, response) {
     
    if (!request.object.isNew()) {
      // Let existing object updates go through
      response.success();
    }
     
    var query = new Parse.Query(GameScore);
    // Add query filters to check for uniqueness
    query.equalTo("location", request.object.get("location"));
    query.first().then(function(existingObject) {
      if (existingObject) {
        // Update existing object
        existingObject.set("score", request.object.get("score"));
        return existingObject.save();
      } else {
        // Pass a flag that this is not an existing object
        return Parse.Promise.as(false);
      }
    }).then(function(existingObject) {
      if (existingObject) {
        // Existing object, stop initial save
        response.error("Existing object");
      } else {
        // New object, let the save go through
        response.success();
      }
    }, function (error) {
      response.error("Error performing checks or saves.");
    });
});*/
 
Parse.Cloud.define("testCurrentUser", function(request, response) {
    console.log("Current User" + request.user);
});
 
Parse.Cloud.define("removeConversation", function(request, response) {
     
    //Parse.Cloud.useMasterKey();
     
});
 
Parse.Cloud.define("validateFriendRequest", function(request, response) {
     
    //Parse.Cloud.useMasterKey();
     
    var toUserId = request.params.toUser;
    var fromUserId = request.params.fromUser;
     
    // other user is already friends
    // other user already friend request
     
    var toUserQuery = new Parse.Query(Parse.User);
    toUserQuery.get(fromUserId, {useMasterKey: true}).then(function(fromUser) {
        var fromUserFriends = fromUser.relation("friends");
        from
    }).then(function(user){
         
    });
     
});
 
Parse.Cloud.define("sendFriendRequest", function(request, response) {
     
    Parse.Cloud.useMasterKey();
    var fromUserId = request.params.fromUser;
    var toUserId = request.params.toUser;
    var toUserQuery = new Parse.Query(Parse.User);
    toUserQuery.get(toUserId, {useMasterKey: true,
        success: function(toUser) {
             
            var fromUserQuery = new Parse.Query(Parse.User);
            fromUserQuery.get(fromUserId, {useMasterKey: true,
                success: function(fromUser){
                     
                    var toUserRequests = toUser.relation("friendRequests");
                    toUserRequests.add(fromUser);
                    toUser.save(null, {useMasterKey: true,
                        success: function(object) {
 
                            var deviceQuery = new Parse.Query(Parse.Installation);
                            deviceQuery.equalTo("user", toUser);
 
                                Parse.Push.send({
                                  where: deviceQuery, // Set our Installation query
                                  data: {
                                    alert: "You have a partner request from " + fromUser.get("username"),
                                    badge: "Increment",
                                    type: "friendRequest"
                                  }
                                }, {
                                  success: function() {
                                    response.success(true);
                                  },
                                  error: function(error) {
                                    response.error(error);
                                  }
                                });
 
                                response.success(object);
                        },
                        error: function(object, error) {
                            response.error(error);
                        }
                    });
 
                },
        error: function(error) {
          response.error(error);
        }
 
      });
 
    },
    error: function(error) {
      response.error(error);
    }
  });
 
});
 
Parse.Cloud.define("acceptFriendRequest", function(request, response) {
 
  //Parse.Cloud.useMasterKey();
  var acceptingUser = request.user;
  var sendingUserId = request.params.sendingUser;
 
  var sendingUserQuery = new Parse.Query(Parse.User);
  sendingUserQuery.get(sendingUserId, {useMasterKey: true,
    success: function(sendingUser){
 
      var sendingUserFriends = sendingUser.relation("friends");
      sendingUserFriends.add(acceptingUser);
      sendingUser.save(null, {
        success: function(){
          response.success(true);
        },
        error: function(error){
          response.error(error);
        }
      });
 
    },
    error: function(error){
      response.error(error);
    }
  })
 
});
 
Parse.Cloud.define("unfriendUser", function(request, response) {
 
  //Parse.Cloud.useMasterKey();
  var currentUser = request.user;
  var unfriendedUserId = request.params.unfriendedUser;
 
  var unfriendedUserQuery = new Parse.Query(Parse.User);
  unfriendedUserQuery.get(unfriendedUserId, {useMasterKey: true,
    success: function(unfriendedUser){
 
      var unfriendedUserFriends = unfriendedUser.relation("friends");
      unfriendedUserFriends.remove(currentUser);
      unfriendedUser.save(null, {
        success: function(){
          response.success(true);
        },
        error: function(error){
          response.error(error);
        }
      });
 
    },
    error: function(error){
      response.error(error);
    }
  })
 
});
 
Parse.Cloud.define("acceptFriendRequest420", function(request, response) {
 
  //Parse.Cloud.useMasterKey();
  var acceptingUserId = request.params.acceptingUser;
  var sendingUserId = request.params.sendingUser;
  var acceptingUser = null;
  var itemsToSave = [];
 
  var acceptingUserQuery = new Parse.Query(Parse.User);
  acceptingUserQuery.get(acceptingUserId, {useMasterKey: true,
    success: function(_acceptingUser){
      acceptingUser = _acceptingUser;
 
      var sendingUserQuery = new Parse.Query(Parse.User);
      sendingUserQuery.get(sendingUserId, {useMasterKey: true,
        success: function(sendingUser){
 
          var acceptingUserRequests = acceptingUser.relation("friendRequests");
          acceptingUser.remove(sendingUser);
 
          var acceptingUserFriends = acceptingUser.relation("friends");
          acceptingUserFriends.add(sendingUser);
 
          var sendingUserFriends = sendingUser.relation("friends");
          sendingUserFriends.add(acceptingUser);
 
          itemsToSave.push(acceptingUser);
          itemsToSave.push(sendingUser);
 
          Parse.Object.saveAll(itemsToSave, {useMasterKey: true,
            success: function() {
              response.success(true);
            },
            error: function(error) {
              response.error(error);
            }
          });
 
        },
        error: function(error){
          response.error(error);
        }
      });
 
    },
    error: function(error){
      response.error(error);
    }
  });
 
});
 
Parse.Cloud.define("acceptFriendRequestSemi", function(request, response) {
 
  //Parse.Cloud.useMasterKey();
  var acceptingUserId = request.params.acceptingUser;
  var sendingUserId = request.params.sendingUser;
 
  var acceptingUserQuery = new Parse.Query(Parse.User);
  acceptingUserQuery.get(acceptingUserId, {useMasterKey: true,
    success: function(acceptingUser) {
 
      var sendingUserQuery = new Parse.Query(Parse.User);
      sendingUserQuery.get(sendingUserId, {useMasterKey: true,
        success: function(sendingUser) {
 
          var acceptingUserRequests = acceptingUser.relation("friendRequests");
          acceptingUserRequests.remove(sendingUser);
 
          var acceptingUserFriends = acceptingUser.relation("friends");
          acceptingUser.add(sendingUser);
          acceptingUser.save(null, {useMasterKey: true,
            success: function(object) {
 
              var sendingUserFriends = sendingUser.relation("friends");
              sendingUserFriends.add(acceptingUser);
              sendingUser.save(null, {useMasterKey: true,
                success: function(object) {
                  response.success(true);
                }
              });
 
            }
          });
 
        },
        error: function(error) {
          response.error(error);
        }
      });
 
    },
    error: function(error){
        response.error(error);
    }
  });
 
});
 
Parse.Cloud.define("acceptFriendRequest2", function(request, response) {
 
  //Parse.Cloud.useMasterKey();
  var acceptingUserId = request.params.acceptingUser;
  var sendingUserId = request.params.sendingUser;
 
  var acceptingUserQuery = new Parse.Query(Parse.User);
  acceptingUserQuery.get(acceptingUserId, {useMasterKey: true,
    success: function(acceptingUser) {
 
      var sendingUserQuery = new Parse.Query(Parse.User);
      sendingUserQuery.get(sendingUserId, {useMasterKey: true,
        success: function(sendingUser) {
 
          var acceptingUserRequests = acceptingUser.relation("friendRequests");
          acceptingUserRequests.remove(sendingUser);
 
          var acceptingUserFriends = acceptingUser.relation("friends");
          acceptingUser.add(sendingUser);
          acceptingUser.save(null, {useMasterKey: true,
            success: function(object) {
 
              var sendingUserFriends = sendingUser.relation("friends");
              sendingUserFriends.add(acceptingUser);
              sendingUser.save(null, {useMasterKey: true,
                success: function(object) {
                  response.success(true);
                }
              });
 
            }
          });
 
        },
        error: function(error) {
          response.error(error);
        }
      });
 
    },
    error: function(error){
        response.error(error);
    }
  });
 
});
 
Parse.Cloud.define("incrementLike", function(request, response) {
 
  var postId = request.params.postId;
  var likingUserId = request.params.likingUser;
 
  var likingUserQuery = new Parse.Query(Parse.User);
  likingUserQuery.get(likingUserId, {
    success: function(likingUser) {
 
      var postQuery = Parse.Query("Post");
      postQuery.get(postId, {
        success: function(post) {
          var likesCount = post.get("likesCount");
          likesCount++;
 
          var likers = post.relation("likers");
          likers.add(likingUser);
          post.save(null, {
            success: function() {
              response.success(true);
            }
          });
        }
      });
 
    }
 
  });
});
 
Parse.Cloud.define("deincrementLike", function(request, response) {
 
  var postId = request.params.postId;
  var dislikingUserId = request.params.likingUser;
 
  var dislikingUserQuery = new Parse.Query(Parse.User);
  likingUserQuery.get(dislikingUserId, {
    success: function(dislikingUser) {
 
      var postQuery = Parse.Query("Post");
      postQuery.get(postId, {
        success: function(post) {
          var likesCount = post.get("likesCount");
          likesCount--;
 
          var likers = post.relation("likers");
          likers.remove(dislikingUser);
          post.save(null, {
            success: function() {
              response.success(true);
            }
          });
        }
      });
 
    }
 
  });
});
 
/*Parse.Cloud.beforeSave(Parse.Installation, function(request, response) {
  // request.user is a Parse.User object. It corresponds to the currently logged in user in iOS or Android.
  if (request.user) {
    // Add a pointer to the Parse.User object in a "user" column.
    request.object.set("user", request.user);
  }
 
  // Proceed with saving the installation.
  response.success();
});*/
 
Parse.Cloud.afterSave("Chat", function(request) {
 
  //Parse.Cloud.useMasterKey();
 
  var fromUserId = request.object.get("fromUser").id;
  var toUserId = request.object.get("toUser").id;
  var message = request.object.get("message");
 
  var toUserQuery = new Parse.Query(Parse.User);
  toUserQuery.get(toUserId, {useMasterKey: true,
      success: function(toUser) {
 
        var fromUserQuery = new Parse.Query(Parse.User);
        fromUserQuery.get(fromUserId, {useMasterKey: true,
          success: function(fromUser) {
 
            var fromUsername = fromUser.get("username");
 
            var deviceQuery = new Parse.Query(Parse.Installation);
            deviceQuery.equalTo("user", toUser);
 
            Parse.Push.send({
              where: deviceQuery, // Set our Installation query
              data: {
                alert: fromUsername+ ": " + message,
                fromUserId: fromUserId,
                badge: "Increment",
                type: "chatMessage"
              }
            }, {
              success: function() {
 
              },
              error: function(error) {
                // Handle error
              }
            });
 
          }
        });
 
      }
  });
 
 
 
});
 
Parse.Cloud.afterSave("Notification", function(request) {
 
  //Parse.Cloud.useMasterKey();
 
  var fromUserId = request.object.get("fromUser").id;
  var toUserId = request.object.get("toUser").id;
  var text = request.object.get("text");
  var toUserQuery = new Parse.Query(Parse.User);
  toUserQuery.get(toUserId, {useMasterKey: true,
      success: function(toUser) {
 
        var fromUserQuery = new Parse.Query(Parse.User);
        fromUserQuery.get(fromUserId, {useMasterKey: true,
          success: function(fromUser) {
 
            var fromUsername = fromUser.get("username");
            var deviceQuery = new Parse.Query(Parse.Installation);
            deviceQuery.equalTo("user", toUser);
 
            Parse.Push.send({
              where: deviceQuery, // Set our Installation query
              data: {
                alert: fromUsername+ ": " + text,
                fromUserId: fromUserId,
                badge: "Increment",
                type: "Post Notification"
              }
            }, {
              success: function() {
 
              },
              error: function(error) {
                // Handle error
              }
            });
 
          }
        });
 
      }
  });
});