client.getChatById("6383dfd8f06958b583a92436").then(chat => {
  //general
  chat.id//returns the chats id
  chat.author//returns the author of the chat | check user.js for the properties extending this property
  chat.text//returns the text of the chat
  chat.reply("text")//replies to the chat
  chat.report("reason", "report")//reports the chat
  
  chat.onEdit(callback => {
    //check onEdit.js for more information
  })

  //self chat
  chat.delete()//deletes chat
  //premium
  chat.edit("text")//edits chat
})
