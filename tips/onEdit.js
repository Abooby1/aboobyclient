client.getPostById("63a37a1418b6f1948ba2927e").then(post => {
  post.onEdit(edit => {
    edit.text//the new text of the post
    edit.id//the post id of the edit
  })
})

client.getChatById("63a37a8f18b6f1948ba29298").then(chat => {
  chat.onEdit(edit => {
    edit.text//the new text of the chat
    edit.id//the chat id of the edit
  })
})
