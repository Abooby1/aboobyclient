import fetch from "node-fetch"
import axios from 'axios'
import FormData from "form-data"
import SimpleSocket from "simple-socket-js"
import fs from 'fs'
import sleep from "es7-sleep";
import JSONdb from "simple-json-db";
const socket = new SimpleSocket({
    project_id: "61b9724ea70f1912d5e0eb11",
    project_token: "client_a05cd40e9f0d2b814249f06fbf97fe0f1d5"
});

async function sendRequest(url, method, body, auth, contentType = "application/json", stringify = true, useJson = false) {
  return new Promise(async (resolve, reject) => {
    let data = {
      method: method,
      headers: {
        "cache": "no-cache",
        "Content-Type": contentType,
        "auth": auth || client.auth
      }
    }

    if(body) {
      if (typeof body == "object" && body instanceof FormData == false) {
        body = JSON.stringify(body);
      }
      data.body = body;
    }

    let response = await fetch(url, data)
    resolve([response.status, await response.text()])
  })
}

var client;
const serverURL = 'https://photop.exotek.co/';
const assetURL = 'https://photop-content.s3.amazonaws.com/';

var postCache = new Array();

//listeners
var clientListeners = new Object()
var userListeners = new Object()
var postListeners = new Object()
var chatListeners = new Object()
var groupListeners = new Object()
var messageListeners = new Object()
//

/*
TODO
* Finish listeners
* Message class
*/

//utils
async function formatBotData() {
  let [code, response] = await sendRequest(serverURL + 'me', 'GET')

  if(code == 200) {
    response = JSON.parse(response)
    client.userData = response.user;

    if(clientListeners['ready']) {
      clientListeners['ready'].forEach(listener => {
        listener()
      })
    }

    socket.subscribe({
      task: "invite",
      userID: response.user._id
    }, function(data) {
      if (!data.Name) return;
      if(!clientListeners['invite']) return;
      clientListeners['invite'].forEach(listener => {
        listener(new groupUserInvite(data))
      })
    })
    socket.subscribe({
			task: 'profile',
			_id: response.user._id
    }, async function(data) {
      switch(data.type) {
        case 'follow':
          if(clientListeners['followed'] && data.change == 1) {
            clientListeners['followed'].forEach(async (listener) => {
              let [code, userData] = await sendRequest(serverURL + 'user?id=' + data.userID, 'GET')
              if(code == 200) {
                listener(new user(JSON.parse(userData)))
              }
            })
          }
          if(clientListeners['unfollowed'] && data.change == -1) {
            clientListeners['unfollowed'].forEach(async (listener) => {
              let [code, userData] = await sendRequest(serverURL + 'user?id=' + data.userID, 'GET')
              if(code == 200) {
                listener(new user(JSON.parse(userData)))
              }
            })
          }
          break;
      }
    })
  }
}
//

//sockets
socket.remotes.stream = function(data) {
  let chatData = data.chat;

  switch (data.type) {
    case 'chat':
      if(postListeners['chat']) {
        postListeners['chat'].forEach(async (listener) => {
          let [postid, callback] = listener;

          if(postid == chatData.PostID) {
            let [code, userData] = await sendRequest(serverURL + 'user?id=' + chatData.UserID, 'GET')
            if(code == 200) {
              userData = JSON.parse(userData)
            } else {
              userData = null;
            }

            let [code2, responseData] = await sendRequest(serverURL + 'chats?chatid=' + chatData._id, 'GET')

            if(code2 == 200) {
              responseData = JSON.parse(responseData).chats[0];

              callback(new chat({
                chat: responseData,
                user: userData
              }))
            }
          }
        })
      }
      break;
    case 'chatdelete':
      if(chatListeners['delete']) {
        chatListeners['delete'].forEach(async (listener) => {
          let [chatid, callback] = listener;

          if(chatid == data.chatID) {
            callback(data.chatID)
          }
        })
      }
      break;
    case 'chatedit':
      if(chatListeners['edit']) {
        chatListeners['edit'].forEach(async (listener) => {
          let [chatid, callback] = listener;

          if(chatid == data.chatID) {
            let [code2, responseData] = await sendRequest(serverURL + 'chats?chatid=' + data.chatID, 'GET')
            if(code2 == 200) {
              responseData = JSON.parse(responseData).chats[0];
            }

            let [code, userData] = await sendRequest(serverURL + 'user?id=' + responseData.UserID, 'GET')
            if(code == 200) {
              userData = JSON.parse(userData)
            } else {
              userData = null;
            }

            if(code2 == 200) {
              callback(new chat({
                chat: responseData,
                user: userData
              }))
            }
          }
        })
      }
      break;
  }
}
socket.subscribe({
  task: 'general',
  location: 'home'
}, async function(data) {
  let postData = data.post;
  switch(data.type) {
    case 'newpost':
      if(!clientListeners['post']) return;

      let [code, userData] = await sendRequest(serverURL + 'user?id=' + postData.UserID, 'GET')
      if(code == 200) {
        userData = JSON.parse(userData)
      } else {
        userData = null;
      }

      let [code2, postResponse] = await sendRequest(serverURL + 'posts?postid=' + postData._id, 'GET')
      if(code2 == 200) {
        postResponse = JSON.parse(postResponse).posts[0];
        clientListeners['post'].forEach(postListener => {
          postListener(new post({
            post: postResponse,
            user: userData
          }))
        })
      }
      break;
  }
})

var postSocket;
function refreshPostSocket() {
  if(!postListeners['mainSocket']) return;
  let posts = [];
  postListeners['mainSocket'].forEach(listener => {
    if(posts.includes(listener[0])) return;
    posts.push(listener[0])
  })

  let query = {
    task: 'post',
    _id: posts
  }
  if(postSocket) {
    postSocket.edit(query)
    return;
  }

  postSocket = socket.subscribe(query, async function(data) {
    switch(data.type) {
      case 'delete':
        postListeners['mainSocket'].forEach(listener => {
          let [postid, callback, type] = listener;
          if(type == 'delete' && postid == data._id) {
            callback(data._id)
          }
        })
        break;
      case 'edit':
        postListeners['mainSocket'].forEach(async (listener) => {
          let [postid, callback, type] = listener;
          if(type == 'edit' && postid == data._id) {
            let [code, postData] = await sendRequest(serverURL + 'posts?postid=' + postid, 'GET')
            if(code == 200) {
              postData = JSON.parse(postData).posts[0];
              let [code2, userData] = await sendRequest(serverURL + 'user?id=' + postData.UserID, 'GET')
              if(code2 == 200) {
                userData = JSON.parse(userData)
              } else {
                userData = null;
              }

              callback(new post({
                post: postData,
                user: userData
              }))
            }
          }
        })
        break;
      case 'like':
        if(data.change == 1) {
          postListeners['mainSocket'].forEach(async (listener) => {
            let [postid, callback, type] = listener;
            if(type == 'like' && postid == data._id) {
              let [code, postData] = await sendRequest(serverURL + 'posts?postid=' + postid, 'GET')
              if(code == 200) {
                postData = JSON.parse(postData).posts[0];
                let [code2, userData] = await sendRequest(serverURL + 'user?id=' + postData.UserID, 'GET')
                if(code2 == 200) {
                  userData = JSON.parse(userData)
                } else {
                  userData = null;
                }

                callback(new post({
                  post: postData,
                  user: userData
                }))
              }
            }
          })
        } else {
          postListeners['mainSocket'].forEach(async (listener) => {
            let [postid, callback, type] = listener;
            if(type == 'dislike' && postid == data._id) {
              let [code, postData] = await sendRequest(serverURL + 'posts?postid=' + postid, 'GET')
              if(code == 200) {
                postData = JSON.parse(postData).posts[0];
                let [code2, userData] = await sendRequest(serverURL + 'user?id=' + postData.UserID, 'GET')
                if(code2 == 200) {
                  userData = JSON.parse(userData)
                } else {
                  userData = null;
                }

                callback(new post({
                  post: postData,
                  user: userData
                }))
              }
            }
          })
        }
        break;
    }
  })
}
//

export class Client {
  constructor({token, userid}) {
    this.auth = `${userid};${token}`;
    this.userid = userid;

    client = this;
    formatBotData()
  }

  get postCache() {
    return postCache;
  }

  async on(type, data) {
    if(!data.callback && typeof data != 'function') return;
    var formatted = typeof data == 'function'?data:data.callback;

    if(data.groupid) {
      socket.subscribe({
        task: "general",
        location: "home",
        groups: [data.groupid]
      }, async function(data) {
        if (!data.post.GroupID) return;
        let postData = data.post;
        
        let [code, userData] = await sendRequest(serverURL + 'user?id=' + postData.UserID, 'GET')
        if(code == 200) {
          userData = JSON.parse(userData)
        } else {
          userData = null;
        }

        let [code2, postResponse] = await sendRequest(serverURL + 'posts?postid=' + postData._id, 'GET')
        if(code2 == 200) {
          postData = JSON.parse(postResponse).posts[0];
          formatted(new post({
            post: postData,
            user: userData,
            group: data.groupid
          }))
        }
      })
      
      formatted = null;
    }

    if(!formatted) return;
    if(clientListeners[type]) {
      clientListeners[type].push(formatted)
    } else {
      clientListeners[type] = [formatted];
    }
  }

  async post(text, data) {
    data = data || {};

    let images = data.images || [];
    let group = data.groupid;

    return new Promise(async (resolve, reject) => {
      let form = new FormData()
      form.append("data", JSON.stringify({ text }))
      for(let i = 0; i != Math.min(images.length, 2); i++) {
        form.append("image-" + i, fs.createReadStream(images[i]), "image.jpg")
      }

      let response = await axios.post(`${serverURL}posts/new${group?`?groupid=${group}`:''}`, form, {
        headers: {
          "auth": client.auth
        }
      })
      if(response.status == 200) {
        let [code2, postData] = await sendRequest(`${serverURL}posts?postid=${await response.data}${group?`&groupid=${group}`:''}`, 'GET')
        if(code2 == 200) {
          postData = JSON.parse(postData).posts[0];
          resolve(new post({
            post: postData,
            user: client.userData,
            group: group
          }))
        }
      } else {
        resolve(await response.data);
      }
    })
  }
  async createGroup({name, inviteType, image}) {
    let form = new FormData()
    form.append('data', JSON.stringify({name, invite: inviteType}))
    if(image) {
      form.append('image', fs.createReadStream(image))
    }

    let data = await fetch(serverURL + 'groups/new', {
      method: 'POST',
      body: form,
      headers: {
        "auth": client.auth
      }
    })

    let [code, response] = await sendRequest(serverURL + 'groups?groupid=' + await data.text(), 'GET')
    if(code == 200) {
      response = JSON.parse(response);
      return new group(response)
    } else {
      return await data.text()
    }
  }

  async getPostById(postid, groupid) {
    return new Promise(async (res, rej) => {
      let [code, postData] = await sendRequest(serverURL + 'posts?postid=' + postid + (groupid?`&groupid=${groupid}`:''), 'GET')
      if(code == 200) {
        postData = JSON.parse(postData).posts[0];
        let [code2, userData] = await sendRequest(serverURL + 'user?id=' + postData.UserID, 'GET')
        if(code2 == 200) {
          userData = JSON.parse(userData)
        } else {
          userData = null;
        }

        res(new post({
          post: postData,
          user: userData
        }))
      }
    })
  }
  async getChatById(chatid) {
    return new Promise(async (res, rej) => {
      let [code, chatData] = await sendRequest(serverURL + 'chats?chatid=' + chatid, 'GET')
      if(code == 200) {
        chatData = JSON.parse(chatData).chats[0];
        let [code2, userData] = await sendRequest(serverURL + 'user?id=' + chatData.UserID, 'GET')
        if(code2 == 200) {
          userData = JSON.parse(userData)
        } else {
          userData = null;
        }

        res(new chat({
          chat: chatData,
          user: userData
        }))
      }
    })
  }
  async getBlocked() {
    return new Promise(async (res, rej) => {
      let [code, response] = await sendRequest(serverURL + 'me/blocked', 'GET')
      if(code == 200) {
        response = JSON.parse(response)
        res(response.map(a=> {
          return new user(a)
        }))
      } else {
        res(response);
      }
    })
  }
  async getUserById(userid) {
    return new Promise(async (res, rej) => {
      let [code, response] = await sendRequest(serverURL + 'user?id=' + userid, 'GET')
      if(code == 200) {
        res(new user(JSON.parse(response)))
      } else {
        res(response)
      }
    })
  }
  async getUserByName(username) {
    return new Promise(async (res, rej) => {
      let [code, response] = await sendRequest(serverURL + 'user?name=' + username, 'GET')
      if(code == 200) {
        res(new user(JSON.parse(response)))
      } else {
        res(response)
      }
    })
  }
  async getUsers(term) {
    return new Promise(async (res, rej) => {
      let [code, response] = await sendRequest(serverURL + 'user/search?amount=15&term=' + term, 'GET')
      if(code == 200) {
        response = JSON.parse(response)
        res(response.map(a=>{
          return new user(a)
        }))
      } else {
        res(response)
      }
    })
  }
  async getGroupById(groupid) {
    return new Promise(async (res, rej) => {
      let [code, response] = await sendRequest(serverURL + 'groups?groupid=' + groupid, 'GET')
      if(code == 200) {
        res(new group(JSON.parse(response)))
      } else {
        res(response)
      }
    })
  }
  /*
  async getMessages(conversationId) {
    //
  }
  async getMessageById(messageId) {
    //
  }
  async getConvo(conversationId) {
    let [code, covnoData] = await sendRequest(serverURL + 'conversations?convid=' + conversationId, 'GET')
    if(code == 200) {
      covnoData = JSON.parse(response).conversations[0]
    }

    let [code2, userData] = await sendRequest(serverURL + 'user?id=' + covnoData.Creator, 'GET')
    if(code2 == 200) {
      userData = JSON.parse(userData)
    } else {
      userData = null;
    }
    
    if(code == 200) {
      return new conversation({
        convo: covnoData,
        user: userData
      })
    }
  }
  async getConvoRequests() {
    let [code, response] = await sendRequest(serverURL + 'conversations/requests', 'GET')
    if(code == 200) {
      response = JSON.parse(response).conversations;
      return response.map(async (a) => {
        let [code2, userData] = await sendRequest(serverURL + 'user?id=' + response.Creator, 'GET')
        if(code2 == 200) {
          userData = JSON.parse(userData)
        } else {
          userData = null;
        }

        return new conversationRequest({
          convo: a,
          user: userData
        })
      })
    }
  }*/

  async groupInvites() {
    return new Promise(async (res, rej) => {
      let [code, response] = await sendRequest(serverURL + 'groups/invites?amount=75', 'GET')
      if(code == 200) {
        response = JSON.parse(response).invites;
        res(response.map(a => {
          return new groupUserInvite(a)
        }))
      } else {
        res(response);
      }
    })
  }
  async joinGroup({code, groupid}) {
    var param;
    if(code) {
      param = `?code=${code}`;
    } else if(groupid) {
      param = `?groupid=${groupid}`;
    }

    let [_, response] = await sendRequest(serverURL + 'groups/join' + param, 'PUT')
    return response;
  }
  async leaveGroup(groupid) {
    let [_, response] = await sendRequest(serverURL + 'groups/leave?groupid=' + groupid, 'DELETE')
    return response;
  }
  async deletePost(postid) {
    let [_, response] = await sendRequest(serverURL + 'posts/delete?postid=' + postid, 'DELETE')
    return response;
  }
  async deleteChat(chatid) {
    let [_, response] = await sendRequest(serverURL + 'chats/delete?chatid=' + chatid, 'DELETE')
    return response;
  }

  async updateBio(newBio) {
    let [_, response] = await sendRequest(serverURL + 'me/settings', 'POST', {
      update: 'description',
      value: newBio
    })
    return response;
  }
  async updateUsername(newUsername) {
    let [_, response] = await sendRequest(serverURL + 'me/settings', 'POST', {
      update: 'username',
      value: newUsername
    })
    return response;
  }
  async updateVisibility(newVisi) {
    let [_, response] = await sendRequest(serverURL + 'me/settings', 'POST', {
      update: 'visibility',
      value: newVisi
    })
    return response;
  }
  async updateProfilePic(newPic) {
    let form = new FormData()
    form.append('image', fs.createReadStream(newPic))
    let data = await fetch(serverURL + 'me/new/picture', {
      method: 'POST',
      body: form,
      headers: {
        "auth": client.auth
      }
    })
    return await data.text()
  }
  async updateBanner(newBanner) {
    let form = new FormData()
    form.append('image', fs.createReadStream(newBanner))
    let data = await fetch(serverURL + 'me/new/banner', {
      method: 'POST',
      body: form,
      headers: {
        "auth": client.auth
      }
    })
    return await data.text()
  }

  async unbanUser(userid) {
    let [_, response] = await sendRequest(serverURL + 'mod/unban?userid=' + userid, 'PATCH')
    return response;
  }
}

class post {
  constructor({post, user, group}) {
    this.postData = post;
    this.userData = user;
    this.groupId = group;
    this.connections = new Array();
  }

  get id() {
    return this.postData._id;
  }
  get author() {
    if(this.userData == null) return;

    return new user(this.userData);
  }
  get text() {
    return this.postData.Text;
  }
  get media() {
    let data = [];
    if(this.postData.Media) {
      for(let i=0;i<this.postData.Media.ImageCount;i++) {
        data.push(`${assetURL}PostImages/${this.postData._id}${i}`)
      }
    }

    return data;
  }
  get stats() {
    return {
      likes: this.postData.Likes,
      quotes: this.postData.Quotes,
      chats: this.postData.Chats
    }
  }

  async disconnect() {
    this.connections.forEach(data => {
      Object.keys(postListeners).forEach(listener => {
        postListeners[listener].splice(data, 1)
      })
    })
  }

  async on(type, data) {
    if(!data.callback && typeof data != 'function') return;
    var formatted = typeof data == 'function'?data:data.callback;

    switch(type) {
      case 'delete':
        formatted = [this.postData._id, formatted, 'delete'];
        this.connections.push(formatted)
        type = 'mainSocket';
        break;
      case 'edit':
        formatted = [this.postData._id, formatted, 'edit'];
        this.connections.push(formatted)
        type = 'mainSocket';
        break;
      case 'like':
        formatted = [this.postData._id, formatted, 'like'];
        this.connections.push(formatted)
        type = 'mainSocket';
        break;
      case 'dislike':
        formatted = [this.postData._id, formatted, 'dislike'];
        this.connections.push(formatted)
        type = 'mainSocket';
        break;
      case 'chat':
        formatted = [this.postData._id, formatted];
        this.connections.push(formatted)
        let formattedPostIds = postListeners['chat']?postListeners['chat'].map(a=>{
          return a[0];
        }):[];
        formattedPostIds.push(this.postData._id)

        let [code, response] = await sendRequest(serverURL + 'chats/connect' + (data.group?`?groupid=${data.group}`:''), 'POST', {
          ssid: socket.secureID,
          connect: formattedPostIds
        })
        break;
    }

    if(postListeners[type]) {
      postListeners[type].push(formatted)
    } else {
      postListeners[type] = [formatted];
    }

    refreshPostSocket()
  }

  cache() {
    postCache.push([
      this.postData,
      this.userData,
      this.groupId
    ])
  }

  async chat(text, replyID) {
    let [code, response] = await sendRequest(serverURL + 'chats/new?postid=' + this.postData._id, 'POST', {
      text,
      replyID
    })

    if(code == 200) {
      let [code2, chatData] = await sendRequest(serverURL + 'chats?chatid=' + response, 'GET')
      if(code2 == 200) {
        chatData = JSON.parse(chatData).chats[0];
        return new chat({
          chat: chatData,
          user: client.userData
        })
      } else {
        return response;
      }
    }
  }
  async edit(text) {
    let form = new FormData()
    form.append('data', JSON.stringify({text}))

    let data = await fetch(serverURL + 'posts/edit?postid=' + this.postData._id, {
      method: 'POST',
      body: form,
      headers: {
        "auth": client.auth
      }
    })

    return await data.text()
  }
  async delete() {
    let [_, response] = await sendRequest(serverURL + 'posts/delete?postid=' + this.postData._id, 'DELETE')
    return response;
  }

  async pin() {
    let [_, response] = await sendRequest(serverURL + 'posts/pin?postid=' + this.postData._id, 'PUT')
    return response;
  }
  async unpin() {
    let [_, response] = await sendRequest(serverURL + 'posts/unpin?postid=' + this.postData._id, 'DELETE')
    return response;
  }
  async like() {
    let [_, response] = await sendRequest(serverURL + 'posts/like?postid=' + this.postData._id, 'PUT')
    return response;
  }
  async dislike() {
    let [_, response] = await sendRequest(serverURL + 'posts/unlike?postid=' + this.postData._id, 'DELETE')
    return response;
  }

  async report({reason, report}) {
    let [_, response] = await sendRequest(serverURL + 'mod/report?contentid=' + this.postData._id + '&type=post', 'PUT', {
      reason,
      report
    })
    return response;
  }
}

class user {
  constructor(data) {
    this.userData = data;
  }

  get bot() {
    return this.userData._id == client.userData._id?true:false;
  }
  get ping() {
    return `@${this.userData._id}"${this.userData.User}"`
  }
  get id() {
    return this.userData._id;
  }
  get name() {
    return this.userData.User;
  }
  get roles() {
    if (typeof this.userData.Role == 'string') {
      return [this.userData.Role];
    } else {
      return this.userData.Role;
    }
  }
  get status() {
    let parsedStatus;
    switch(this.userData.Status) {
      case 0:
        parsedStatus = 'Offline';
        break;
      case 1:
        parsedStatus = 'Online';
        break;
      case 2:
        parsedStatus = 'In Group';
        break;
    }

    return {
      raw: this.userData.Status,
      parsed: parsedStatus
    };
  }
  get settings() {
    return {
      profilePicture: assetURL + 'ProfileImages/' + this.userData.Settings.ProfilePic,
      profileBanner: assetURL + 'ProfileBanners/' + this.userData.Settings.ProfileBanner,
      description: this.userData.ProfileData.Description,
      visibility: this.userData.ProfileData.Visibility,
      pinnedPost: this.userData.ProfileData.PinnedPost
    }
  }

  get followers() {
    return this.userData.ProfileData.Followers
  }
  get following() {
    return this.userData.ProfileData.Following
  }
  async parsedFollowers() {
    return new Promise(async (res, rej) => {
      let [code, response] = await sendRequest(serverURL + 'user/followers?amount=50&userid=' + this.userData._id, 'GET')
      if(code == 200) {
        response = JSON.parse(response)
        res(response.map(a => {
          return new user(a)
        }))
      } else {
        res(response);
      }
    })
  }
  async parsedFollowing() {
    return new Promise(async (res, rej) => {
      let [code, response] = await sendRequest(serverURL + 'user/following?amount=50&userid=' + this.userData._id, 'GET')
      if(code == 200) {
        response = JSON.parse(response)
        res(response.map(a => {
          return new user(a)
        }))
      } else {
        res(response);
      }
    })
  }

  async on(type, data) {
    if(!data.callback && typeof data != 'function') return;
    var formatted = typeof data == 'function'?data:data.callback;

    switch(type) {
      case 'followed':
        break;
      case 'unfollowed':
        break;
    }

    if(!formatted) return;
    if(userListeners[type]) {
      userListeners[type].push(formatted)
    } else {
      userListeners[type] = [formatted];
    }
  }

  async follow() {
    let [_, response] = await sendRequest(serverURL + 'user/follow?userid=' + this.userData._id, 'PUT')
    return response;
  }
  async unfollow() {
    let [_, response] = await sendRequest(serverURL + 'user/unfollow?userid=' + this.userData._id, 'PUT')
    return response;
  }
  async block() {
    let [_, response] = await sendRequest(serverURL + 'user/block?userid=' + this.userData._id, 'PUT')
    return response;
  }
  async unblock() {
    let [_, response] = await sendRequest(serverURL + 'user/unblock?userid=' + this.userData._id, 'PUT')
    return response;
  }
  async ban({length, reason, terminate}) {
    let [_, response] = await sendRequest(serverURL + 'mod/ban?userid=' + this.userData._id, 'DELETE', {
      length,
      reason,
      terminate
    })
    return response;
  }

  async report({reason, report}) {
    let [_, response] = await sendRequest(serverURL + 'mod/report?contentid=' + this.userData._id + '&type=user', 'PUT', {
      reason,
      report
    })
    return response;
  }
}

class chat {
  constructor({chat, user}) {
    this.chatData = chat;
    this.userData = user;
  }

  get id() {
    return this.chatData._id;
  }
  get author() {
    if(this.userData == null) return;

    return new user(this.userData)
  }
  get text() {
    return this.chatData.Text;
  }
  get postid() {
    return this.chatData.PostID;
  }
  get replyid() {
    return this.chatData.ReplyID;
  }

  async on(type, data) {
    if(!data.callback && typeof data != 'function') return;
    var formatted = typeof data == 'function'?data:data.callback;

    switch(type) {
      case 'edit':
        formatted = [this.chatData._id, formatted];
        break;
      case 'delete':
        formatted = [this.chatData._id, formatted];
        break;
    }

    if(chatListeners[type]) {
      chatListeners[type].push(formatted)
    } else {
      chatListeners[type] = [formatted];
    }
  }

  async reply(text) {
    let [code, response] = await sendRequest(serverURL + 'chats/new?postid=' + this.chatData.PostID, 'POST', {
      text,
      replyID: this.chatData._id
    })

    if(code == 200) {
      let [code2, response2] = await sendRequest(serverURL + 'chats?chatid=' + response, 'GET')
      if(code2 == 200) {
        return new chat({
          chat: JSON.parse(response2).chats[0],
          user: client.userData
        })
      } else {
        return response;
      }
    } else {
      return response;
    }
  }
  async edit(text) {
    let [_, response] = await sendRequest(serverURL + 'chats/edit?chatid=' + this.chatData._id, 'POST', {
      text
    })
    return response;
  }
  async delete() {
    let [_, response] = await sendRequest(serverURL + 'chats/delete?chatid=' + this.chatData._id, 'DELETE')
    return response;
  }

  async report({reason, report}) {
    let [_, response] = await sendRequest(serverURL + 'mod/report?contentid=' + this.chatData._id + '&type=chat', 'PUT', {
      reason,
      report
    })
    return response;
  }
}

class conversation {
  //
}
class conversationRequest {
  //
}
class message {
  //
}

class group {
  constructor(data) {
    this.groupData = data;
  }

  get id() {
    return this.groupData._id;
  }
  get name() {
    return this.groupData.Name;
  }
  get owner() {
    return this.groupData.Owner
  }

  async on(type, data) {
    if(!data.callback && typeof data != 'function') return;
    var formatted = typeof data == 'function'?data:data.callback;
    var send = true;

    switch(type) {
      case 'newMember':
        console.log('The "newMember" listener for groups isnt complete at this time.')
        /*socket.subscribe({
          task: 'group',
          groupID: this.groupData._id
        }, async function(data) {
          console.log(data)
          if(data.type == 'member' && data.member.Status != -1) {
            let [code, userData] = await sendRequest(serverURL + 'user?id=' + data.member._id, 'GET')
            if(code == 200) {
              formatted(new user(JSON.parse(userData)))
            }
          }
        })*/
        break;
      case 'post':
        const groupId = this.groupData._id;
        socket.subscribe({
          task: "general",
          location: "home",
          groups: [this.groupData._id]
        }, async function(data) {
          if (!data.post.GroupID) return;
          let postData = data.post;
          
          let [code, userData] = await sendRequest(serverURL + 'user?id=' + postData.UserID, 'GET')
          if(code == 200) {
            userData = JSON.parse(userData)
          } else {
            userData = null;
          }
  
          let [code2, postResponse] = await sendRequest(serverURL + 'posts?postid=' + postData._id + '&groupid=' + groupId, 'GET')
          if(code2 == 200) {
            postResponse = JSON.parse(postResponse).posts[0];
            formatted(new post({
              post: postResponse,
              user: userData,
              group: groupId
            }))
          }
        })
        send = false;
        break;
    }

    if(!send) return;
    if(groupListeners[type]) {
      groupListeners[type].push(formatted)
    } else {
      groupListeners[type] = [formatted];
    }
  }

  async post(text, data) {
    data = data || {};

    let images = data.images || [];
    let group = this.groupData._id;

    return new Promise(async (resolve, reject) => {
      let form = new FormData()
      form.append("data", JSON.stringify({ text }))
      for(let i = 0; i != Math.min(images.length, 2); i++) {
        form.append("image-" + i, fs.createReadStream(images[i]), "image.jpg")
      }

      let response = await axios.post(`${serverURL}posts/new${group?`?groupid=${group}`:''}`, form, {
        headers: {
          "auth": client.auth
        }
      })
      if(response.status == 200) {
        let [code2, postData] = await sendRequest(`${serverURL}posts?postid=${await response.data}${group?`&groupid=${group}`:''}`, 'GET')
        if(code2 == 200) {
          postData = JSON.parse(postData).posts[0];
          resolve(new post({
            post: postData,
            user: client.userData,
            group: group
          }))
        }
      } else {
        resolve(await response.data);
      }
    })
  }

  async getUsers() {
    return new Promise(async(res, res) => {
      let [code, response] = await sendRequest(serverURL + 'groups/members?groupid=' + this.groupData._id, 'GET')
      if(code == 200) {
        response = JSON.parse(response)
        res(response.map(a => {
          return new user(a)
        }))
      } else {
        res(response);
      }
    })
  }
  async kick(userid) {
    let [_, response] = await sendRequest(serverURL + 'groups/moderate?groupid=' + this.groupData._id, 'PUT', {
      type: 'kick',
      data: userid
    })
    return response;
  }
  async edit({name, inviteType, image}) {
    let form = new FormData()
    form.append('data', JSON.stringify({name, invite: inviteType}))
    if(image) {
      form.append('image', fs.createReadStream(image))
    }

    let data = await fetch(serverURL + 'groups/edit?groupid=' + this.groupData._id, {
      method: 'POST',
      body: form,
      headers: {
        "auth": client.auth
      }
    })

    return await data.text()
  }
  async leave() {
    let [_, response] = await sendRequest(serverURL + 'groups/leave?groupid=' + this.groupData._id, 'DELETE')
    return response;
  }
  async invite(userid) {
    let [_, response] = await sendRequest(serverURL + 'groups/invite?groupid=' + this.groupData._id, 'POST', {
      type: 'user',
      data: userid
    })
    return response;
  }
  async createLink() {
    let [_, response] = await sendRequest(serverURL + 'groups/invite?groupid=' + this.groupData._id, 'POST', {
      type: 'link',
      data: new Date() + (((60000 * 60) * 24) * 365)
    })
    return response;
  }
  async invites() {
    return new Promise(async (res, rej) => {
      let [code, users] = await sendRequest(serverURL + 'groups/sentinvites?groupid=' + this.groupData._id + '&type=user&amount=200', 'GET')
      let [code2, links] = await sendRequest(serverURL + 'groups/sentinvites?groupid=' + this.groupData._id + '&type=link&amount=200', 'GET')
      if(code == 200) {
        users = JSON.parse(users).members
      } else {
        users = [];
      }
      if(code2 == 200) {
        links = JSON.parse(links).links
      } else {
        links = [];
      }

      res({
        users: users.map(a => {
          return new groupInvite(a)
        }),
        links: links.map(a => {
          return new groupInvite(a)
        })
      })
    })
  }
}
class groupInvite {
  constructor(data) {
    this.inviteData = data;
  }

  async revoke() {
    let [_, response] = await sendRequest(serverURL + 'groups/revoke?inviteid=' + this.inviteData._id, 'DELETE')
    return response;
  }
}
class groupUserInvite {
  constructor(data) {
    this.inviteData = data;
    console.log(data)
  }

  async accept() {
    let [_, response] = await sendRequest(serverURL + 'groups/join?code=' + this.inviteData._id, 'PUT')
    return response;
  }
  async deny() {
    let [_, response] = await sendRequest(serverURL + 'groups/revoke?inviteid=' + this.inviteData._id, 'DELETE')
    return response;
  }
}

export default Client;
