client.onPost(post => {
  post.onChat(chat => {
    chat.id//returns the chats id
    chat.author//returns the author of the chat | check user.js for the properties extending this property
    chat.text//returns the text of the chat
    chat.reply("text")//replies to the chat
    
    chat.report("reason", "report")//reports the chat
  })
})
