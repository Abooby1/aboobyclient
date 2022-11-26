//config: "groupConnection" is true
client.onPost(post => {
  console.log(post)
})

//config: "groupConnection" is false
client.onPost(post => {
  console.log(post)
}, '63825ab0d62f9d79c645a176')
