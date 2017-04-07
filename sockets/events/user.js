exports.init = function(io,client,user,users) {

  // When user join, resend new list of users
  io.sockets.emit('user:connected',user)
  // io.sockets.emit('users:get',users)

  function joinRoom(roomName,userMouse) {
    client.join(roomName)
    client.emit('room:joined',roomName)
    user.room = roomName
    user.mouse = userMouse
    var roomUsers = getRoomUsers(roomName)

    io.to(roomName).emit('user:join:room',roomUsers);
  }

  function disconnectRomm(roomName, userMouse) {
    client.leave(roomName);
    user.room = "";
    user.mouse = userMouse;
    console.log(user.name + ' has leave ' + roomName);
    io.to(roomName).emit('user:disconnect:room',user.id);
  }

  function getRoomUsers(roomName) {
    var usersRoom = []
    var room = getRoom(roomName)

    for(id in room.sockets) {
      usersRoom.push(users[id]);
    }

    return usersRoom
  }

  function getRoom(roomName) {
    return io.sockets.adapter.rooms[roomName];
  }

  function updatePosition(data) {
    if(user.room) {
      user.mouse = data.mouse
      users[user.id].mouse = data.mouse
      io.to(user.room).emit('user:moves',data);
    }
  }

  function getUser() {
    var data = {
      user: user.get()
    }
    client.emit('user:get',data)
  }

  function getAllUsers() {
    client.emit('users:get',users)
  }

  function changeName(data) {

      if(data.name.length > 10) {
          data.name = data.name.substr(0,10);
          data.name += "..."
      }

      user.name = data.name;
      users[user.id] = user;
      getUser()
  }

  client.on('users:get', getAllUsers);
  client.on('user:change:name', changeName);
  client.on('user:moves', updatePosition);
  client.on('user:get', getUser);
  client.on('room:join', joinRoom);
  client.on('user:disconnect:room', disconnectRomm);
};
