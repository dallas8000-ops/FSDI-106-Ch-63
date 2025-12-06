const APT_URL=https://106api-b0bnggbsgnezbzcz.westus3-01.azurewebsites.net/api/tasks

function saveTask(){
    const title = $('#txtTitle').val();
    const description = $('#txtDescription').val();
    const color = $('#selColor').val();
    const date = $('#selDate').val();
    const status = $('#selStatus').val();
    const budget = $('#numBudget').val();

    const data = new Task(title, description, color, date, status, budget);
    console.log(data);
}

//test the connection to the API
function testRequest()

{$.ajax({
    type: "get",
    url: APT_URL,
    data: JSON.stringify(data),
    contentType: "application/json",
});
  }


function init(){
    $('#btnSave').click(saveTask);    
}
window.onload = init;