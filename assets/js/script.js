var tasks = {};

var createTask = function(taskText, taskDate, taskList) {
  // create elements that make up a task item
  var taskLi = $("<li>").addClass("list-group-item");

  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(taskDate);
    
  var taskP = $("<p>")
    .addClass("m-1")
    .text(taskText);

  // append span and p element to parent li
  taskLi.append(taskSpan, taskP);

  // check due date
  // execute auditTask before adding the task item to the page (ensures the element has all of its proper classes before getting to the page)
  auditTask(taskLi);

  // append to ul list on the page
  $("#list-" + taskList).append(taskLi);
};

var loadTasks = function() {
  tasks = JSON.parse(localStorage.getItem("tasks"));

  // if nothing in localStorage, create a new object to track all task status arrays
  if (!tasks) {
    tasks = {
      toDo: [],
      inProgress: [],
      inReview: [],
      done: []
    };
  }

  // loop over object properties
  $.each(tasks, function(list, arr) {
    console.log(list, arr);
    // then loop over sub-array
    arr.forEach(function(task) {
      createTask(task.text, task.date, list);
    });
  });
};

var saveTasks = function() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
};

var auditTask = function(taskEl) {
  // to ensure element is getting to the function
  console.log(taskEl);

  // get date from task element
  var date = $(taskEl).find("span").text().trim();

  // ensure it worked
  console.log(date);

  // convert to moment object at 5:00pm
  var time = moment(date, "L").set("hour", 17);
  // this should print out an object of the date varialbe, but at 5:00pm of that date
  console.log(time);

  // remove any old classes from element
  $(taskEl).removeClass("list-group-item-warning list-group-item-danger");

  // apply new class if task is near/over due date
  if (moment().isAfter(time)) {
    $(taskEl).addClass("list-group-item-danger");
  }
  else if (Math.abs(moment().diff(time, "days")) <=2) {
    $(taskEl).addClass("list-group-item-warning");
  }
};

$(".card .list-group").sortable({
  connectWith: $(".card .list-group"),
  scroll: false,
  tolerance: "pointer",
  helper: "clone",
  activate: function(event) {
    $(this).addClass("dropover");
    $(".bottom-trash").addClass("bottom-trash-drag");
    // console.log("activate", this);
  },
  deactivate: function(event) {
    $(this).removeClass("dropover");
    $(".bottom-trash").removeClass("bottom-trash-drag");
    // console.log("deactivate", this);
  },
  over: function(event) {
    $(event.target).addClass("dropover-active");
    $(".bottom-trash").addClass("bottom-trash-active");
    // console.log("over", this);
  },
  out: function(event) {
    $(event.target).removeClass("dropover-active");
    $(".bottom-trash").removeClass("bottom-trash-active");
    // console.log("out", this);
  },
  update: function(event) {
    // array to store the task data in
    var tempArr = [];

    // loop over current set of children in sortable list
    $(this).children().each(function() {
      var text = $(this)
        .find("p")
        .text()
        .trim();
      
      var date = $(this)
        .find("span")
        .text()
        .trim();
      
      console.log(text, date);

      // add task data to the temp array as an object
      tempArr.push({
        text: text,
        date: date
      });
    });
    // trim down list's ID to match object property
    var arrName = $(this)
      .attr("id")
      .replace("list-", "");

    // update array on tasks object and save
    tasks[arrName] = tempArr;
    saveTasks();

    console.log(tempArr);
  },
  stop: function(event) {
    $(this).removeClass("dropover");
  }
});

// trash icon can be dropped onto
$("#trash").droppable({
  accept: ".card .list-group-item",
  tolerance: "touch",
  drop: function(event, ui) {
    console.log("drop");
    // remove dragged element from the DOM
    ui.draggable.remove();
  },
  over: function(event, ui) {
    console.log("over");
  },
  out: function(event, ui) {
    console.log("out");
  }
});

// modal was triggered
$("#task-form-modal").on("show.bs.modal", function() {
  // clear values
  $("#modalTaskDescription, #modalDueDate").val("");
});

// modal is fully visible
$("#task-form-modal").on("shown.bs.modal", function() {
  // highlight textarea
  $("#modalTaskDescription").trigger("focus");
});

$("#modalDueDate").datepicker({
  minDate: 1
});

// save button in modal was clicked
$("#task-form-modal .btn-save").click(function() {
  // get form values
  var taskText = $("#modalTaskDescription").val();
  var taskDate = $("#modalDueDate").val();

  if (taskText && taskDate) {
    createTask(taskText, taskDate, "toDo");

    // close modal
    $("#task-form-modal").modal("hide");

    // save in tasks array
    tasks.toDo.push({
      text: taskText,
      date: taskDate
    });

    saveTasks();
  }
});

// click event listener for click on task to turn <p> into <textarea>
$(".list-group").on("click", "p", function() {
  // console.log(this);
  var text = $(this)
    .text()
    .trim();
  console.log(text);

  var textInput = $("<textarea>")
    .addClass("form-control")
    .val(text);
  
  $(this).replaceWith(textInput);
  textInput.trigger("focus");
});

// blur event listener to turn <textarea> back into <p>
$(".list-group").on("blur", "textarea", function() {
  // get the textarea's current value/text
  var text = $(this)
    .val()
    .trim();

  // get the parent ul's id attribute
  var status = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-", "");

  // get the task's position in the list of other li elements
  var index = $(this)
    .closest(".list-group-item")
    .index();
  
  tasks[status][index].text = text;
  saveTasks();

  // convert the <textarea> back into a <p> element
  var taskP = $("<p>")
    .addClass("m-1")
    .text(text);

  // replace textarea with p element
  $(this).replaceWith(taskP);
});

// due date was clicked (edit date)
$(".list-group").on("click", "span", function() {
  // get current text
  var date = $(this)
    .text()
    .trim();

  // create new input element
  var dateInput = $("<input>")
    .attr("type", "text")
    .addClass("form-control")
    .val(date);

  // swap out elements
  $(this).replaceWith(dateInput);

  // enable jquery ui datepicker
  dateInput.datepicker({
    minDate: 1,
    // onClose allows us to execute a function when the datepicker closes
    onClose: function() {
      // when calendar is closed, force a "change event on the 'dateInput"
      $(this).trigger("change");
    }
  });

  //automatically focus on new element / bring up the calendar
  dateInput.trigger("focus");
});

// due date was changed (converted back to span when user clicks outside)
$(".list-group").on("change", "input[type='text']", function() {
  // get current text
  var date = $(this)
    .val()
    .trim();

  // get the parent ul's id attribute
  var status = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-", "");

  // get the task's position in the list of other li elements
  var index = $(this)
    .closest(".list-group-item")
    .index();

  // update task in array and re-save to localStorage
  tasks[status][index].date = date;
  saveTasks();

  // recreate span element with bootstrap classes
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(date);
  
    // replace input with span element
    $(this).replaceWith(taskSpan);
  
    // Pass task's <li> element into auditTask() to check new due date
    auditTask($(taskSpan).closest(".list-group-item"));
});

// remove all tasks
$("#remove-tasks").on("click", function() {
  for (var key in tasks) {
    tasks[key].length = 0;
    $("#list-" + key).empty();
  }
  saveTasks();
});

// load tasks for the first time
loadTasks();

setInterval(function() {
  // pass each element it finds using the selector into the callback function
  // the element is expressed in the el argument of the function
  // auditTask() passes the element to its routines using the el argument
  $(".card .list-group-item").each(function(index, el) {
    auditTask(el);
  });
}, 1800000);