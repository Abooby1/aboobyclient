import fetch from "node-fetch"
import FormData from "form-data"
import SimpleSocket from "simple-socket-js"
import fs from 'fs'
import sleep from "es7-sleep";
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
    if (!auth.includes(atob("Ym90Xw=="))) {throw new Error(atob("T25seSBib3QgdG9rZW5zIGNhbiBiZSB1c2VkIHdpdGggYWJvb2J5Y2xpZW50Lg=="))}
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
            return new Promise(async (res, rej) => {
                const findGroup = function(groupid) {
                    return new Promise(async (res, rej) => {
                        let group2 = JSON.parse(await request(url('groups?groupid=' + groupid), 'GET', undefined, auth))
                        let users = JSON.parse(await request(url(`groups/members?groupid=${groupid}`), 'GET', undefined, auth))
                        if (group2.groups) {
                            group2 = group2.groups[0]
                        }
                        let parsedGroup = group2
                        res([parsedGroup, users])
                    })
                }

                const parseGroupData = async function(data) {
                    return new Promise((res, rej) => {
                        let [groupData, users] = data
                        res(new group(groupData, users))
                    })
                }

                let parsedGroups = [];
                Object.keys(data).forEach(id => {
                    findGroup(id).then(async groupData => {
                        parsedGroups.push(await parseGroupData(groupData))
                    })
                })

                await sleep(1000)
                res(parsedGroups)
            })
        case 'users':
            if (!data) return [];
            return new Promise(async (res, rej) => {
                let formattedUsers = []

                const getUser = async function(userid) {
                    return await request(url(`user?id=${userid}`), "GET")
                }

                data.forEach(async userdata => {
                    var userData = await getUser(userdata._id)

                    try {
                        formattedUsers.push(new user(JSON.parse(userData)))
                    } catch(err) {
                        formattedUsers.push(userData)
                    }
                })

                await sleep(1500)
                res(formattedUsers)
            })
        case 'groupIds':
            if (!data) return [];
            let groupData2 = [];
            let groups = Object.keys(data)
            for(var i=0;i<groups.length;i++) {
                groupData2.push(groups[i])
            }
            return groupData2;
        case 'posts':
            if (!data) return [];
            let postData = []
            data.forEach(post => {
                postData.push(new selfPost(post))
            })
            return postData;
    }
}

let botConfigurations = {
    photopstats:false,
    postConnections:true
}
function justifyConfigs(configs) {
    Object.keys(configs).forEach(config => {
        switch (config) {
            case 'statcontrib':
                botConfigurations.photopstats = configs[config];
                break;
            case 'groupConnection':
                botConfigurations.postConnections = configs[config];
                break;

            default:
                throw new Error(`Configuration ${config} doesnt exist.`)
        }
    })
}

let onEdit = {
    chat: [],
    post: []
}
let onPost = [];
let onInvite = [];
let onMention = [];
let onReady = [];
let onDelete = [];
let onLike = {};

let postcache = [];

let chatConnects = [];
let posts = [];

let rate = {
    post: {
        amount: 0,
        time: 0
    },
    chat: {
        amount: 0,
        time: 0
    }
}

let postSocketConnection;

let botData;
var loaded = false;

var a = setInterval(async function() {
    if (!loaded) return;
    if (!auth) return;
    botData = JSON.parse(await request(url('me'), 'GET', undefined, auth))
    clearInterval(a)
    setTimeout(async function() {
        let query = {
            task: "general",
            location: "home"
        }
        if (botConfigurations.postConnections) {
            query.groups = await format('groupIds', JSON.parse(await request(url('me'), 'GET', undefined, auth)).groups)
        }
        socket.subscribe(query, async function(data) {
            if (data.type != 'newpost') return;
            posts.push(data.post._id)
            try {
                let postData = JSON.parse(await request(url('posts?postid=' + data.post._id + (data.post.GroupID?`&groupid=${data.post.GroupID}`:'')), 'GET', undefined, auth)).posts[0]
                let postText = postData.Text
                if (postText.includes(`@${botData.user._id}`)) {
                    let mentionUserData = JSON.parse(await request(url('user?id=' + data.post.UserID), 'GET'))
                    onMention.forEach(async mentionConnection => {
                        mentionConnection({
                            user: new user(mentionUserData),
                            data: {
                                type: 'post',
                                data: new post(postData)
                            }
                        })
                    })
                }
            }catch(err){}

            let query = {
                task: 'post',
                _id: posts
            }
            if (postSocketConnection) {
                postSocketConnection.edit(query)
            } else {
                postSocketConnection = socket.subscribe(query, async function(data) {
                    switch (data.type) {
                        case 'like':
                            Object.keys(onLike).forEach(async postid => {
                                if (data.post._id != postid) return;
                                let userData = JSON.parse(await request('user?id=' + data.userID), 'GET')
                                onLike[postid]({
                                    change: data.change,
                                    user: new user(userData)
                                })
                            })
                            break;
                        case 'delete':
                            onDelete.forEach(deleteConnection => {
                                deleteConnection({
                                    type: 'post',
                                    data: new deletedPost(data)
                                })
                            })
                            break;
                        case 'edit':
                            onEdit.post.forEach(postedit => {
                                postedit(new editedPost(data))
                            })
                            break;
                    }
                })
            }

            let groupId = data.post.GroupID?`&groupid=${data.post.GroupID}`:''
            let postData = JSON.parse(await request(url('posts?postid=' + data.post._id + groupId), 'GET', undefined, auth)).posts[0]
            let userData;
            try {
                userData = JSON.parse(await request(url('user?id=' + data.post.UserID), 'GET'))
            }catch(err) {}
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
            let userData;
            try {
                userData = JSON.parse(await request(url('user?id=' + data.chat.UserID), 'GET'))
            }catch(err) {}
            if (chatData.Text.includes(`@${botData.user._id}`)) {
                onMention.forEach(async mentionConnection => {
                    mentionConnection({
                        user: new user(userData),
                        data: {
                            type: 'chat',
                            data: new chat(chatData, userData)
                        }
                    })
                })
            }
            chatConnects.forEach(chatConnection => {
                let [postId, callback] = chatConnection;
                if (data.chat.PostID == postId) {
                    callback(new chat(chatData, userData))
                }
            })
            break;
        case 'chatdelete':
            onDelete.forEach(deleteConnection => {
                deleteConnection({
                    type: 'chat',
                    data: new deletedChat(data)
                })
            })
            break;
        case 'chatedit':
            onEdit.chat.forEach(chatedit => {
                chatedit(new editedChat(data))
            })
            break;
    }
}
let auth;
export class Client {
    constructor(config) {
        if (botData)  {
            throw new Error('Bot has already been connected in this project.')
        }
        if (!config.token.startsWith('bot_')) {
            throw new Error('Only bot tokens can be used with aboobyclient.')
        }
        auth = `${config.userid};${config.token}`
        this.auth = `${config.userid};${config.token}`

        if (config.config) {
            justifyConfigs(config.config)
        }

        loaded = true;
    }
    
    get postCache() {
        return postcache;
    }

    onPost(callback, groupId) {
        if (groupId) {
            socket.subscribe({
                task: "general",
                location: "home",
                groups: [groupId]
            }, async function(postData) {
                if (!postData.post.GroupID) return;
                let userData = JSON.parse(await request(url('user?id=' + postData.post.UserID), 'GET'))
                postData = JSON.parse(await request(url('posts?postid=' + postData.post._id + '&groupid=' + groupId), 'GET', undefined, auth)).posts[0]
                try {
                    if (postData.Text.includes(`@${botData.user._id}`)) {
                        onMention.forEach(async mentionConnection => {
                            mentionConnection({
                                user: new user(userData),
                                data: {
                                    type: 'post',
                                    data: new post(postData, groupId, userData)
                                }
                            })
                        })
                    }
                }catch(err){}
                callback(new post(postData, groupId, userData))
            })
            return;
        }
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
    onDelete(callback) {
        onDelete.push(callback)
    }

    async post(text, group = '', images = []) {
        return new Promise(async (resolve, reject) => {
            let form = new FormData()
            form.append("data", JSON.stringify({ text }))
            for(let i = 0; i != Math.min(images.length, 2); i++) {
                form.append("image-" + i, fs.createReadStream(images[i]), "image.jpg")
            }
            const response1 = await fetch(url('posts/new' + (group == "" ? group : "?groupid=" + group)), {
                method: "POST",
                body: form,
                headers: {
                    auth: auth
                }
            })
            const response = await response1.text()
    
            if (botConfigurations.photopstats) {
                aboobySocket.publish({task: 'botPost'}, {})
            }
    
            let response2 = JSON.parse(await request(url('posts?postid=' + response + (group == "" ? group : "&groupid=" + group)), 'GET', undefined, auth))
            resolve(new selfPost(response2.posts[0], group))
        })
    }
    async userData() {
        return new Promise(async (res, rej) => {
            let response = await request(
                url('me'),
                'GET',
                undefined,
                this.auth
            )
            response = JSON.parse(response)
            let userPostData = JSON.parse(await request(url('posts?userid=' + response.user._id + '&amount=100'), 'GET')).posts
            res({
                user: new user(response.user),
                getPosts: function() {
                    return new Promise(async (res, rej) => {
                        const posts = await format('posts', userPostData)
                        if (!posts) {
                            rej(userPostData)
                        } else {
                            res(posts)
                        }
                    })
                },
                getGroups: function() {
                    return new Promise(async (res, rej) => {
                        const groups = await format('groups', response.groups)
                        if (!groups) {
                            rej(response.groups)
                        } else {
                            res(groups)
                        }
                    })
                }
            })
        })
    }
    async notify(userid, config) {
        if (!userid) return;
        if (!config) return;
        if (!config.title) return;
        if (!config.content) return;

        aboobySocket.publish({task: 'sendNotif'}, {title: config.title, content: config.content, userId: userid, authorId:botData.user._id})
    }

    async getPostById(id, groupId) {
        return new Promise(async (resolve, reject) => {
            let response = await request(url('posts?postid=' + id + (groupId ? "&groupid=" + groupId : "")), 'GET')
            let postData;
            try {
                postData = JSON.parse(response).posts[0]
            } catch(err) {
                reject(response)
            }
            if (postData.UserID == botData.user._id) {
                resolve(new selfPost(postData, undefined))
            } else {
                resolve(new post(postData, undefined))
            }
        })
    }
    async getChatById(id) {
        return new Promise(async (resolve, reject) => {
            let response = await request(url('chats?chatid=' + id), 'GET')
            let chatData;
            try {
                chatData = JSON.parse(response).chats[0]
            } catch(err) {
                reject(response)
            }
            if (chatData.UserID == botData.user._id) {
                resolve(new selfChat(chatData))
            } else {
                resolve(new chat(chatData))
            }
        })
    }
    async getGroupById(id) {
        return new Promise(async (resolve, reject) => {
            let groupData = await request(url('groups?groupid=' + id), 'GET', undefined, auth)
            try {
                groupData = JSON.parse(groupData)
            } catch(err) {
                reject(groupData)
            }
            let users = await request(url(`groups/members?groupid=${id}`), 'GET', undefined, auth)
            try {
                users = JSON.parse(users)
            } catch(err) {
                reject(users)
            }
            resolve(new group(groupData, users))
        })
    }
    async getUserById(id) {
        return new Promise(async (resolve, reject) => {
            let response = await request(url('user?id=' + id), 'GET')
            try {
                JSON.parse(response)
            } catch(err) {
                reject(response)
            }
            resolve(new user(response))
        })
    }
    async getUserByName(name) {
        return new Promise(async (resolve, reject) => {
            let response = await request(url('user?name=' + name), 'GET')
            try {
                JSON.parse(response)
            } catch(err) {
                reject(response)
            }
            resolve(new user(response))
        })
    }
    async joinGroup(id) {
        let response = await request(url('groups/join?groupid=' + id), 'PUT', undefined, this.auth)
        return response;
    }

    async deletePost(id) {
        let response = await request(url('posts/delete?postid=' + id), 'DELETE', undefined, this.auth)
        return response;
    }
    async deleteChat(id) {
        let response = await request(url('chats/delete?chatid=' + id), 'DELETE', undefined, this.auth)
        return response;
    }

    async updateBio(text) {
        let response = await request(url('me/settings'), 'POST', {
            update: 'description',
            value: text
        }, this.auth)
        return response;
    }
    async updateUsername(username) {
        let response = await request(url('me/settings'), 'POST', {
            update: 'username',
            value: username
        }, this.auth)
        return response;
    }
    async updateVisibility(visi) {
        let response = await request(url('me/settings'), 'POST', {
            update: 'visibility',
            value: visi
        }, this.auth)
        return response;
    }
    async updateProfilePic(image) {
        var formData = new FormData()
        formData.append('image', fs.createReadStream(image))
        let response = await fetch(url('me/new/picture'), {
            method: 'POST',
            body: formData,
            headers: {
                auth: this.auth
            }
        })
        return response.text();
    }
    async updateBanner(image) {
        var formData = new FormData()
        formData.append('image', fs.createReadStream(image))
        let response = await fetch(url('me/new/banner'), {
            method: 'POST',
            body: formData,
            headers: {
                auth: this.auth
            }
        })
        return response.text();
    }
}

class user {
    constructor(userData) {
        this.userData = userData
    }

    get bot() {
        return this.userData._id == botData.user._id?false:true;
    }
    get ping() {
        return `@${this.userData._id}"${this.userData.User}"`
    }
    get id() {
        return this.userData._id
    }
    get username() {
        return this.userData.User
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

    async follow() {
        let response = await request(url('user/follow?userid=' + this.id), 'PUT', {}, auth)
        return response;
    }
    async unfollow() {
        let response = await request(url('user/unfollow?userid=' + this.id), 'PUT', {}, auth)
        return response;
    }
    async status() {
        return {
            parsed: await format('status', this.userData.Status),
            raw: this.userData.Status
        }
    }
    async report(reason, report) {
        let response = await request(url('mod/report?contentid=' + this.id + '&type=user'), 'PUT', {
            reason: reason,
            report: report
        }, auth)
        return response;
    }
    async ban(length, reason, terminate = false) {
        let response = await request(url('mod/ban?userid=' + this.id), 'DELETE', {
            length: length,
            reason: reason,
            terminate: terminate
        }, auth)
        return response;
    }
    async unban() {
        let response = await request(url('mod/unban?userid=' + this.id), 'PATCH', undefined, auth)
        return response;
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
        if (!this.authorData) {
            return 'User data missing.'
        }
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
    
    cache() {
        postcache.push(new post(this.post, this.authorData, this.group))
    }

    async report(reason, report) {
        let response = await request(url('mod/report?contentid=' + this.id + '&type=post'), 'PUT', {
            reason: reason,
            report: report
        }, auth)
        return response;
    }
    async onChat(callback) {
        let groupId = (this.group?'?groupid=' + this.group:'')
        chatConnects.push([this.post._id, callback])
        currentConnections.push(this.post._id)
        const response = await request(url('chats/connect' + groupId), 'POST', {ssid: socket.secureID, connect: currentConnections, posts: currentConnections})
        return response;
    }
    async onLike(callback) {
        onLike[this.id] = callback;
    }
    async onEdit(callback) {
        onEdit.post.push(callback)
    }
    async chat(text) {
        let response = await request(url('chats/new?postid=' + this.post._id), 'POST', {
            text: text
        }, auth)
        let response2 = JSON.parse(await request(url('chats?chatid=' + response), 'GET')).chats[0]
        return new selfChat(response2);
    }
    
    async delete() {
        const response = await request(url(`posts/delete?postid=${this.post._id}`), 'DELETE', undefined, auth)
        return response;
    }
}
class selfPost extends post {
    constructor(response, group) {
        super(response, group, botData)
        this.post = response
        this.group = group
    }

    async edit(text, images = []) {
        let form = new FormData()
        form.append("data", JSON.stringify({ text }))
        for(let i = 0; i != Math.min(images.length, 2); i++) {
            form.append("image-" + i, images[i], "image.jpg")
        }
        const response = await fetch(url("posts/edit?postid=" + this.post._id), {
            method: "POST",
            body: form,
            headers: {
                auth: auth
            }
        })
        return response.text();
    }
    async pin() {
        let response = await request(url('posts/pin?postid=' + this.post._id), 'PUT', {}, auth)
        return response;
    }
    async unpin() {
        let response = await request(url('posts/unpin?postid=' + this.post._id), 'DELETE', {}, auth)
        return response;
    }
}
class deletedPost {
    constructor(response) {
        this.post = response
    }

    get id() {
        return this.post._id
    }
}
class editedPost {
    constructor(response) {
        this.post = response
    }

    get id() {
        return this.post._id
    }
    get text() {
        return this.post.text
    }
}

class chat {
    constructor(chat, user) {
        this.chat = chat
        Object.defineProperty(this, 'authorData', {value: user})
    }
    get author() {
        if (!this.authorData) {
            return 'User data missing.'
        }
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
        let response2 = JSON.parse(await request(url('chats?chatid=' + response), 'GET')).chats[0]
        return new selfChat(response2);
    }
    async report(reason, report) {
        let response = await request(url('mod/report?contentid=' + this.id + '&type=chat'), 'PUT', {
            reason: reason,
            report: report
        }, auth)
        return response;
    }

    async onEdit(callback) {
        onEdit.chat.push(callback)
    }
}
class selfChat extends chat {
    constructor(response) {
        super(response, botData)
        this.chat = response
    }

    async delete() {
        const response = await request(url(`chats/delete?chatid=${this.chat._id}`), 'DELETE', undefined, auth)
        return response;
    }
    async edit(text) {
        const response = await request(url(`chats/edit?chatid=${this.chat._id}`), 'PUT', {
            text: text
        }, auth)
        return response;
    }
}
class deletedChat {
    constructor(response) {
        this.chat = response
    }

    get id() {
        return this.chat.chatID
    }
}
class editedChat {
    constructor(response) {
        this.chat = response
    }

    get id() {
        return this.chat.chatID
    }
    get text() {
        return this.chat.text
    }
}

class group {
    constructor(response, users) {
        this.group = response.groups?response.groups[0]:response,
        this.users = users
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

    async connect(callback) {
        const groupId = this.group._id
        socket.subscribe({
            task: "general",
            location: "home",
            groups: [groupId]
        }, async function(postData) {
            if (!postData.post.GroupID) return;
            let userData = JSON.parse(await request(url('user?id=' + postData.post.UserID), 'GET'))
            postData = JSON.parse(await request(url('posts?postid=' + postData.post._id + '&groupid=' + groupId), 'GET', undefined, auth)).posts[0]
            try {
                if (postData.Text.includes(`@${botData.user._id}`)) {
                    onMention.forEach(async mentionConnection => {
                        mentionConnection({
                            user: new user(userData),
                            data: {
                                type: 'post',
                                data: new post(postData, groupId, userData)
                            }
                        })
                    })
                }
            }catch(err){}
            callback(new post(postData, groupId, userData))
        })
    }

    async getUsers() {
        return new Promise(async (res, rej) => {
            const users = await format('users', this.users)

            await sleep(500)
            res(users)
        })
    }
    async leave() {
        let response = await request(url('groups/leave?groupid=' + this.group._id), 'DELETE', undefined, auth)
        return response;
    }

    async invite(id) {
        let response = await request(url('groups/invite?groupid=' + this.group._id), 'POST', {
            type: 'user',
            data: id
        }, auth)
        return response;
    }

    async kick(id) {
        let response = await request(url('groups/moderate?groupid=' + this.group._id), 'PUT', {
            type: 'kick',
            data: id
        }, auth)
        return response;
    }
    async edit(obj) {
        let form = new FormData()
        let query = {}
        if (obj.name) {
            query.name = obj.name
        }
        if (obj.invite) {
            query.invite = obj.invite
        }
        form.append("data", JSON.stringify(query))
        const response = await fetch(url("groups/edit?groupid=" + this.group._id), {
            method: "PUT",
            body: form,
            headers: {
                auth: auth
            }
        })
        return response.text()
    }
}
class groupInvite {
    constructor(response) {
        this.group = response
    }
    
    async accept() {
        let response = await request(url('groups/join?groupid=' + this.group._id), 'PUT', {}, auth)
        let groupData = JSON.parse(await request(url('groups?groupid=' + this.group._id), 'GET', undefined, auth))
        return new group(groupData);
    }
    async deny() {
        let invite = (await this.invites())[0]
        let response = await request(url('groups/revoke?inviteid=' + invite._id), 'DELETE', {}, auth)
        return response;
    }
}

export default Client
