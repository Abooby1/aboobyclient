client.onMention(mention => {
  mention.user//userdata of the mention
  mention.data//returns: {type: 'chat/post', data: {post/chat data}}
})
