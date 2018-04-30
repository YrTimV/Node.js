
function Menu(addr) {
	return [
		{menuItem: 'Users', menuItemLink: `${addr}\\users`},
		{menuItem: 'Tasks', menuItemLink: `${addr}\\tasks`}
	]
}

module.exports = Menu;
