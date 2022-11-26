import fetch from "node-fetch"
import FormData from "form-data"
import SimpleSocket from "simple-socket-js"
import { response } from "express"
const socket = new SimpleSocket({
    project_id: "61b9724ea70f1912d5e0eb11",
    project_token: "client_a05cd40e9f0d2b814249f06fbf97fe0f1d5"
});
const aboobySocket = new SimpleSocket({
    project_id: "6349eefe3101ef7cafd5d273",
    project_token: "client_cd547ca434101f5dd33b8944f441e0aba66"
})

//modified by IMPixel
async function request(url, method, body, auth, contentType = "application/json", stringify = true, useJson = false) {
    return new Promise((resolve, reject) => {
        let headers = {
            'Content-Type': contentType
        }
        if(auth) {
            headers["auth"] = auth
        }
        if(stringify) {
            body = JSON.stringify(body)
        }
        if(body) {
            fetch(url, {
                method: method,
                headers,
                body: body
            }).then(response => {
                if(useJson) {
                    response.json().then(data => {
                        resolve(data)
                    })
                } else {
                    response.text().then(data => {
                        resolve(data)
                    })
                }
            })
        } else {
            fetch(url, {
                method: method,
                headers,
            }).then(response => {
                if(useJson) {
                    response.json().then(data => {
                        resolve(data)
                    })
                } else {
                    response.text().then(data => {
                        resolve(data)
                    })
                }
            })
        }
    })
}

function url(url) {
    return "https://photop.exotek.co/" + url
}
async function format(type, data) {
    switch (type) {
        case 'status':
            switch (data) {
                case 0:
                    return 'offline'
                case 1:
                    return 'online'
                case 2:
                    return 'group'
            }
            break;
        case 'groups':
            if (!data) return [];
            let groupData = []
            Object.keys(data).forEach(async groupid => {
                let group2 = JSON.parse(await request(url('groups?groupid=' + groupid), 'GET', undefined, auth))
                if (group2.groups) {
                    group2 = group2.groups[0]
                }
                let parsedGroup = group2
                groupData.push(new group(parsedGroup))
            })
            return groupData;
        case 'groupIds':
            if (!data) return [];
            let groupData2 = [];
            let groups = Object.keys(data)
            for(var i=0;i<groups.length;i++) {
                groupData2.push(groups[i])
            }
            return groupData2;
    }
}

let onPost = [];
let onInvite = [];
let onMention = [];
let onReady = [];
let chatConnects = [];

let botData;
var loaded = false;

var a = setInterval(async function() {
    if (!loaded) return;
    if (!auth) return;
    botData = JSON.parse(await request(url('me'), 'GET', undefined, auth))
    clearInterval(a)
    setTimeout(async function() {
        socket.subscribe({
            task: "general",
            location: "home",
            groups: await format('groupIds', JSON.parse(await request(url('me'), 'GET', undefined, auth)).groups)
        }, async function(data) {
            if (data.type != 'newpost') return;
            try {
                let postText = JSON.parse(await request(url('posts?postid=' + data.post._id), 'GET')).posts[0].Text
                if (postText.includes(`@${botData.user._id}`)) {
                    let mentionUserData = JSON.parse(await request(url('user?id=' + data.post.UserID), 'GET'))
                    onMention.forEach(async mentionConnection => {
                        mentionConnection(new user(mentionUserData))
                    })
                }
            }catch(err){}

            let groupId = data.post.GroupID?`&groupid=${data.post.GroupID}`:''
            let postData = JSON.parse(await request(url('posts?postid=' + data.post._id + groupId), 'GET', undefined, auth)).posts[0]
            let userData = JSON.parse(await request(url('user?id=' + data.post.UserID), 'GET'))
            onPost.forEach(postConnection => {
                postConnection(new post(postData, data.GroupID, userData))
            })
        })
        socket.subscribe({
            task: "invite",
            userID: botData.user._id
        }, function(data) {
            if (!data.Name) return;
            onInvite.forEach(inviteConnection => {
                inviteConnection(new groupInvite(data))
            })
        })

        onReady.forEach(readyConnection => {
            readyConnection('Ready!')
        })
    }, 500)
}, 2000)
socket.remotes.stream = async function(data) {
    switch (data.type) {
        case 'chat':
            let chatData = JSON.parse(await request(url('chats?chatid=' + data.chat._id), 'GET')).chats[0]
            let userData = JSON.parse(await request(url('user?id=' + data.chat.UserID), 'GET'))
            chatConnects.forEach(chatConnection => {
                let [postId, callback] = chatConnection;
                if (data.chat.PostID == postId) {
                    callback(new chat(chatData, userData))
                }
            })
            break;
    }
}
let auth;
export class Client {
    constructor(config) {
        auth = `${config.userid};${config.token}`
        this.auth = `${config.userid};${config.token}`

        loaded = true;
    }

    async post(text, group, images = []) {
        let form = new FormData()
        form.append("data", JSON.stringify({ text }))
        for(let i = 0; i != Math.min(images.length, 2); i++) {
            form.append("image-" + i, images[i], "image.jpg")
        }
        const response1 = await fetch(url("posts/new" + (group == "" ? group : "?groupid=" + group)), {
            method: "POST",
            body: form,
            headers: {
                auth: this.auth
            }
        })
        let response = await response1.text()
        return new post(response, group)
    }

    onPost(callback) {
        onPost.push(callback)
    }
    onInvite(callback) {
        onInvite.push(callback)
    }
    onMention(callback) {
        onMention.push(callback)
    }
    onReady(callback) {
        onReady.push(callback)
    }

    async userData() {
        let response = await request(
            url('me'),
            'GET',
            undefined,
            this.auth
        )
        response = JSON.parse(response)
        return {
            user: new user(response.user),
            groups: await format('groups', response.groups)
        }
    }

    async getPostById(id) {
        let response = await request(url('posts?postid=' + id), 'GET')
        return new post(JSON.parse(response).posts[0], undefined)
    }
    async getUserById(id) {
        let response = await request(url('user?id=' + id), 'GET')
        return new user(JSON.parse(response))
    }
    async getUserByName(name) {
        let response = await request(url('user?name=' + name), 'GET')
        return new user(JSON.parse(response))
    }
    async joinGroup(id) {
        let response = await request(url('groups/join?groupid=' + id), 'PUT', undefined, this.auth)
        return response;
    }

    async notify(userid, config) {
        if (!userid) return;
        if (!config) return;
        if (!config.title) return;
        if (!config.content) return;

        aboobySocket.publish({task: 'sendNotif'}, {title: config.title, content: config.content, userId: userid, authorId:botData.user._id})
    }
}

class user {
    constructor(userData) {
        this.userData = userData
    }

    get id() {
        return this.userData._id
    }
    get roles() {
        return this.userData.Role
    }
    get settings() {
        return {
            profilePicture: this.userData.Settings.ProfilePic,
            profileBanner: this.userData.Settings.ProfileBanner,
            description: this.userData.ProfileData.Description,
            visibility: this.userData.ProfileData.visibility
        }
    }
    get follows() {
        return {
            following: this.userData.ProfileData.following,
            followers: this.userData.ProfileData.followers
        }
    }
    async status() {
        return {
            parsed: await format('status', this.userData.Status),
            raw: this.userData.Status
        }
    }
}

let currentConnections = [];
class post {
    constructor(response, group, user) {
        this.post = response
        Object.defineProperty(this, 'authorData', {value: user})
        this.group = group
    }

    get id() {
        return this.post._id
    }
    get author() {
        return new user(this.authorData)
    }
    get text() {
        return this.post.Text
    }
    get stats() {
        return {
            likes: this.post.Likes,
            quotes: this.post.Quotes,
            chats: this.post.Chats
        }
    }
    async pin() {
        let response = await request(url('posts/pin?postid=' + this.post._id), 'PUT', {}, auth)
        return response;
    }

    async delete() {
        const response = await request(url(`posts/delete?postid=${this.post._id}`), 'DELETE', undefined, auth)
        return response;
    }
    async onChat(callback) {
        let groupId = (this.group?'?groupid=' + this.group:'')
        chatConnects.push([this.post._id, callback])
        currentConnections.push(this.post._id)
        const response = await request(url('chats/connect' + groupId), 'POST', {ssid: socket.secureID, connect: currentConnections, posts: currentConnections})
        return response;
    }
    async chat(text) {
        let response = await request(url('chats/new?postid=' + this.post._id), 'POST', {
            text: text
        }, auth)
        return response;
    }
}

class chat {
    constructor(chat, user) {
        this.chat = chat
        Object.defineProperty(this, 'authorData', {value: user})
    }
    get author() {
        return new user(this.authorData)
    }
    get id() {
        return this.chat._id
    }
    get text() {
        return this.chat.Text
    }

    async reply(text) {
        let response = await request(url('chats/new?postid=' + this.chat.PostID), 'POST', {
            text: text,
            replyID: this.chat._id
        }, auth)
        return response;
    }
}

class group {
    constructor(response) {
        this.group = response.groups?response.groups[0]:response,
        this.users = response.users
    }

    get id() {
        return this.group._id
    }
    get name() {
        return this.group.Name
    }
    get owner() {
        return this.group.Owner
    }

    async users() {
        return await format('users', this.users)
    }
}
class groupInvite {
    constructor(response) {
        this.group = response
    }

    async invites() {
        return JSON.parse(await request(url('groups/invites'), 'GET', undefined, auth)).invites
    }
    async accept() {
        let response = await request(url('groups/join?groupid=' + this.group._id), 'PUT', {}, auth)
        return response;
    }
    async deny() {
        let invite = (await this.invites())[0]
        let response = await request(url('groups/revoke?inviteid=' + invite._id), 'DELETE', {}, auth)
        return response;
    }
}
