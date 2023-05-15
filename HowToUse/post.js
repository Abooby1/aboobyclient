client.getPostById("638253dad62f9d79c6459c86").then(post => {
  //utilities
  post.cache()//adds post data to client.postCache
  post.disconnect()//disconnects all listeners of the post | IMPORTANT: if not used bot might get rate limited
  
  //general
  post.id//returns id of the post
  post.author//returns the author of the post | check user.js for the properties extending this property
  post.text//returns the text of the post
  post.media//returns the media of the post

  post.stats.likes//returns the number of likes on the post
  post.stats.quotes//returns the number of quotes on the post
  post.stats.chats//returns the number of chats on the post
  
  post.like()//likes the post
  post.dislike()//unlikes the post if liked

  post.report("reason", "report")//reports the post

  post.chat("text", "replyid (optional)")//chats in a post without reply
  
  post.on(type, function() {
    //main listener for post | check on.js for properties
  })

  //self
  post.pin()//pins the post if the post is yours
  post.unpin()//unpins the post if the post is yours
  post.delete()//deletes the post if its yours
  //premium
  post.edit("text")//edits the post if bot has premium
})
