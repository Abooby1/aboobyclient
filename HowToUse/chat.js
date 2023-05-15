client.getChatById("6383dfd8f06958b583a92436").then(chat => {
  //general
  chat.id//returns the chats id
  chat.author//returns the author of the chat | check user.js for the properties extending this property
  chat.text//returns the text of the chat
  chat.postid//returns the postid of the chat
  chat.replyid//returns the replyid of the chat if it has one
  
  chat.reply("text")//replies to the chat
  
  chat.report({//reports the chat
    reason: "",
    report: ""
  })
  
  chat.on(type, function() {
    //main listener for chat events | check on.js for properties
  })

  //self chat
  chat.delete()//deletes chat
  //premium
  chat.edit("text")//edits chat
})
