
function Menu(addr) {
	return [
		{menuItem: 'My account', menuItemLink: `${addr}\\account`},
		{menuItem: 'Tasks', menuItemLink: `${addr}\\tasks`}
	]
}

module.exports = Menu;
