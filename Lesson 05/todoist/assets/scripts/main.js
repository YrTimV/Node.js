'use strict';

$(window).ready(() => {
	$('#menu').menu({
		items: "> :not(.ui-widget-header)"
	});

	$('#addTask').on('click', () => {
		$('#taskSubmit').val('Add task');
		$('#addTask').hide(0, () => {
			$('.taskFormWrapper').show(200);
		});
	});
});

function editTask(id) {
	const $taskData = $(`[data-id=${id}]`);
	const $taskForm = $('#taskForm');

	$('#taskId', $taskForm).val($('.taskId', $taskData).text().trim());
	$('#taskUserId', $taskForm).val($('.taskUser', $taskData).data('userid'));
	$('#taskTitle', $taskForm).val($('.taskTitle', $taskData).text().trim());
	$('#taskPriorityId', $taskForm).val($('.taskPriority', $taskData).data('priorityid'));
	$('#taskText', $taskForm).val($('.taskText', $taskData).text().trim())
	$('#taskSubmit').val('Update task');

	$('#addTask').hide(0, () => {
		$('.taskFormWrapper').show(200);
	});
}

function completeTask(id) {
	if (confirm(`Do you really want to complete task with id #${id}?`)) {
		$.post('/tasks/complete', {taskId: id});
	}
}

function deleteTask(id) {
	if (confirm(`Do you really want to delete task with id #${id}?`)) {
		$.post('/tasks/delete', {taskId: id});
	}
}
