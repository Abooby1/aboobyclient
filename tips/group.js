let group = client.getGroupById("6335c42a3402fdba72620e37")

group.id//returns the id of the group
group.name//returns the name of the group
group.owner//returns the id of the groups owner

group.users()//returns the users of the group in an array
