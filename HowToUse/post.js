client.getPostById("638253dad62f9d79c6459c86").then(post => {
  //utilities
  post.cache()//adds post data to client.postCache
  
  //general
  post.id//returns id of the post
  post.author//returns the author of the post | check user.js for the properties extending this property
  post.text//returns the text of the post

  post.stats.likes//returns the likes of the post
  post.stats.quotes//returns the quotes of the post
  post.stats.chats//returns the number of chats in the post

  post.report("reason", "report")//reports the post

  post.chat("text")//chats in a post without reply
  
  post.on(type, function() {
    //main listener for post | check on.js for properties
  })

  post.onChat(callback => {
    //check onChat.js for information
  })
  post.onLike(callback => {
    //check onLike.js for information
  })
  post.onEdit(callback => {
    //check onEdit.js for information
  })

  //self
  post.pin()//pins the post if the post is yours
  post.unpin()//unpins the post if the post is yours
  post.delete()//deletes the post if its yours
  //premium
  post.edit("text", ["images"])//edits the post if bot has premium
})
