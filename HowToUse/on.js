//client
"post" // listener for posts at home page | onPost.js
"invite" // listener for group invites | onInvite.js
"mention" // listener for mentions in posts | onMention.js
"ready" // listener for when the client initializes
"delete" // listener for when any content is deleted | onDelete.js
"cache" // listener for when post.cache() is ran
"newFollower" // listener for when client is followed
"unfollow" // listener for when client is unfollowed

//user
"newFollower" // listener for when user is followed
"unfollow" // listener for when user is unfollowed

//post
"chat" // listener for when a chat is made on post | onChat.js
"like" // listener for when a post is liked | onLike.js
"edit" // listener for when a post is edited | onEdit.js

//chat
"edit" // listener for when a chat is edited | onEdit.js

//group
"newMember" // listener for when a member joins the group
