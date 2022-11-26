client.onDelete(deleteAction => {
  switch (deleteAction.type) {
    case 'chat':
      console.log(deleteAction.data)
      break;
    case 'post':
      console.log(deleteAction.data)
      break;
  }
})
