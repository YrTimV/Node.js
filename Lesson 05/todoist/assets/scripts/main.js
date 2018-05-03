'use strict';

$(window).ready(() => {
	$('#menu').menu({
		items: "> :not(.ui-widget-header)"
	});

	$('#addTask').on('click', () => {
		$('#taskSubmit').val('Add task');
		$('#taskForm')[0].reset();
		$('#taskId').val('');
		$('.taskFormWrapper').show(200);
	});

	const $taskForm = $('#taskForm');

	$taskForm.on('submit', (event) => {
		event.preventDefault();
	
		$.post('/tasks/submit', {
				taskId: $('#taskId', $taskForm).val(),
				taskUserId: $('#taskUserId', $taskForm).val(),
				taskPriorityId: $('#taskPriorityId', $taskForm).val(),
				taskTitle: $('#taskTitle', $taskForm).val().trim(),
				taskText: $('#taskText', $taskForm).val().trim()
			}, (data, status) => {
				if (status !== 'success') {
					console.error(status);
	
					return;
				}
	
				if (data) {
					const $row = $(`[data-id=${data.id}]`);
					
					if ($row.length) {
						// Update task data and modify time.
						$('.taskPriority', $row)
							.data('priorityId', data.priority_id)
							.text($('#taskPriorityId option:selected').text());
						$('.taskModifyTime', $row).text(data.modify_time);
						$('.taskTitle', $row).text(data.title);
						$('.taskText', $row).text(data.text);
					} else {
						// Insert new row with task data.
						const $tr = $('<tr>');
						const $btnWrap = $('<div>', {class: 'buttonWrapper'});
						
						$tr.attr('data-id', data.id);
						$('<td>', {class: 'taskId'}).text(data.id).appendTo($tr);
						$('<td>', {class: 'taskUser'})
							.attr('data-userid', data.user_id)
							.text(data.user).appendTo($tr);
						$('<td>', {class: 'taskPriority'})
							.attr('data-priorityid', data.priority_id)
							.text($('#taskPriorityId option:selected').text()).appendTo($tr);
						$('<td>', {class: 'taskCreateTime'})
							.text(data.create_time).appendTo($tr);
						$('<td>', {class: 'taskModifyTime'})
							.text('').appendTo($tr);
						$('<td>', {class: 'taskCompleteTime'})
							.text('').appendTo($tr);
						$('<td>', {class: 'taskTitle'}).text(data.title).appendTo($tr);
						$('<td>', {class: 'taskText'}).text(data.text).appendTo($tr);
						$btnWrap.appendTo($('<td>').appendTo($tr));
						$btnWrap.append($('<button>', {
							id: 'editTask',
							onclick: `editTask(${data.id});`
						}).text('Edit'));
						$btnWrap.append($('<button>', {
							id: 'completeTask',
							onclick: `completeTask(${data.id});`
						}).text('Complete'));
						$btnWrap.append($('<button>', {
							id: 'deleteTask',
							onclick: `deleteTask(${data.id});`
						}).text('Delete'));
						$tr.appendTo($('#tbody'));
					}
	
					$('.taskFormWrapper').hide(200);
				}
		});
	});
});

function editTask(id) {
	const $taskData = $(`[data-id=${id}]`);
	const $taskForm = $('#taskForm');

	$('#taskId', $taskForm).val(id);
	$('#taskUserId', $taskForm).val($('.taskUser', $taskData).data('userid'));
	$('#taskPriorityId', $taskForm).val(
		$('.taskPriority', $taskData).data('priorityid'));
	$('#taskTitle', $taskForm).val($('.taskTitle', $taskData).text().trim());
	$('#taskText', $taskForm).val($('.taskText', $taskData).text().trim())
	$('#taskSubmit').val('Update task');
	$('.taskFormWrapper').show(200);
}

function completeTask(id) {
	if (confirm(`Do you really want to complete task with id #${id}?`)) {
		$.post('/tasks/complete', {taskId: id}, (data, status) => {
			if (status !== 'success') {
				console.error(status);

				return;
			}

			// Update task complete time and remove unneeded buttons.
			if (data) {
				const $row = $(`[data-id=${id}]`);

				$('.taskCompleteTime', $row).text(data);
				$('#editTask, #completeTask', $row).remove();
			}
		});
	}
}

function deleteTask(id) {
	if (confirm(`Do you really want to delete task with id #${id}?`)) {
		$.post('/tasks/delete', {taskId: id}, (data, status) => {
			if (status !== 'success') {
				console.error(status);

				return;
			}

			if (data) {
				$(`[data-id=${id}]`).remove();
			}
		});
	}
}
