client.getGroupById("6335c42a3402fdba72620e37").then(group => {
  group.id//returns the id of the group
  group.name//returns the name of the group
  group.owner//returns the id of the groups owner
  group.getUsers(users => {
    //returns array of users in group
  })
  
  group.on(type, function() {
    //main listener for group | check on.js for properties
  })

  group.leave()//leave the given group
  group.invite("userid")//invite someone to the group
  group.edit({
    name: 'new name of the group',//optional
    invite: 'invite type of the group | either "members" or "owner"'//optional
  })
})
