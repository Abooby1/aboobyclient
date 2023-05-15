client.on("invite", (invite) => {
  invite.accept()//accepts the invite
  invite.deny()//denies the invite
})

group.getInvites(invites => {
  invites.forEach(invite => {
    invite.revoke()
  })
})
