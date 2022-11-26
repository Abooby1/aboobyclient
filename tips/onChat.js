//config: "groupConnection" is true
client.onPost(post => {
  post.onChat(chat => {
    console.log(chat)
  })
})

//config: "groupConnection" is false
client.onPost(post => {
  post.onChat(chat => {
    console.log(chat)
  })
}, '63825ab0d62f9d79c645a176')
