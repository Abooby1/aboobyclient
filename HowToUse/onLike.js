client.onPost(post => {
  post.onLike(like => {
    like.change//returns a number, either 1 or -1 based on if its a like or a dislike
    like.user//returns the user who liked | check user.js for more properties extending this property
  })
})
