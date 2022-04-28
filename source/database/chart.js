const post = require("./composeData");


const data = {
    labels: ["Expense", "Income", "Savings"],
    datasets: [{
        label: 'Income',
        backgroundColor: ['hotpink', "red", "cyan"],
        borderColor: 'rgb(255, 99, 132)',
        data: [400, 900, 1000],
    },
    {
    data: [500, 700, 800]}
]
};

const config = {
    type: 'bar',
    data: data,
    options: {
        responsive:true,
        layout: {
            padding :{
                left : 50,
                right : 50,
                top: 50,
                bottom: 50,
            },
        },
        tooltip: {
            enabled: true,
            backgroundColor : "black",
            titleFontSize : 30,
            bodyFontSize : 50
        },
        title: {
            display : true,
            fontSize : "500px"
        },
        animation : {
            duration : 1000,
            easing : "easeInOutBounce",
        }
    }
};



const myChart = new Chart(
    document.getElementById('myChart'),
    config
);



// button listener

elememt.addEventListener("click", myFunction1);

function myFunction() {
    document.getElementById("")
}