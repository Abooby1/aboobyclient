client.getGroupById("6335c42a3402fdba72620e37").then(group => {
  group.id//returns the id of the group
  group.name//returns the name of the group
  group.owner//returns the id of the groups owner
  group.getUsers(users => {
    //returns array of users in group
  })
  group.invites(invites => {
    //returns array of invites in group
  })
  
  group.on(type, function() {
    //main listener for group | check on.js for properties
  })
  
  group.post("text", {
    images: []
  })

  group.leave()//leave the given group
  group.invite("userid")//invite someone to the group
  group.createLink()//create a link code for the group

  //permission needed
  group.edit({//edits the group settings
    name: "",
    inviteType: "member|owner",
    image: ""
  })
  group.kick("userid")
})
