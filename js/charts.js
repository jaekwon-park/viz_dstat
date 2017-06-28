var parse_line = function() {
  var line = arguments[0],
  i = arguments[1],
  factor = arguments[2],
  year = new Date().getFullYear(),
  day,
  month,
  time,
  arr,
  time_str;

  try {
    day = line.time.split('-')[0];
    month = line.time.split('-')[1].split(' ')[0];
    time = line.time.split(' ')[1];
    arr = [];
    time_str = year + '/' +  month + '/' + day + ' ' + time
//    console.log(time_str);
    arr.push(new Date(time_str));
    for (var i = 3; i < arguments.length; i++) {
      arr.push(factor * line[arguments[i]]);
    }
  }
  catch(err) {
    var err_str = "Problem reading CSV file near line " + (i + header_lines) + '<br>'
    err_str += JSON.stringify(line) + "<br>" + err.message;
    $("#id_error").html(err_str);
  }
//  console.log(JSON.stringify(arr));
  return arr
}

function load_csv() {
  //Read csv data
  //console.log('load_csv');
  $.ajax({
    type: "GET",
    url: csv_fn,
    dataType: "text",
    success: function(data) {
      var i = 0,
      flag = true,
      lines = data.split('\n');

      while (flag) {
        if (lines[i].indexOf("system") != -1) {
          flag = false;
        }
        i += 1;
      }
      var labels = lines[i],
      header = lines.slice(0, i-2),
      body = lines.slice(i, lines.length);
      console.log(header);

      header = header.join([separator = '<br>']);
      $("#id_header").html(header);
      header_lines = i;  // Used in error message in parse_line()

      var csv_data = $.csv.toObjects(body.join([separator = '\n']));
       console.log(csv_data);
      cpu_data = csv_data.map(
        function(x, i) {
       console.log(x + i);
          return parse_line(x, i, 1, "usr", "sys", "idl", "wai", "hiq", "siq");
        }
      );
      mem_data = csv_data.map(
        function(x, i) {
          return parse_line(x, i, 1e-9, "used", "buff", "cach", "free");
        }
      );
      io_data = csv_data.map(
        function(x, i) {
          return parse_line(x, i, 1e-6, "read", "writ");
        }
      );
      net_data = csv_data.map(
        function(x, i) {
          return parse_line(x, i, 1e-6, "recv", "send");
        }
      );
      sys_data = csv_data.map(
        function(x, i) {
          return parse_line(x, i, 1, "int", "csw");
        }
      );
      proc_data = csv_data.map(
        function(x, i) {
          return parse_line(x, i, 1, "run", "blk", "new");
        }
      );
      pag_data = csv_data.map(
        function(x, i) {
          return parse_line(x, i, 1, "in", "out");
        }
      );

      csv_chart(cpu_data, "id_cpu", "CPU", ["datetime", "user", "system", "idle", "wait", "hiq", "siq"], "Usage [ % ]")
      csv_chart(mem_data, "id_mem", "Memory", ["date", "used", "buff", "cache", "free"], "Usage [ GB ]")
      csv_chart(io_data, "id_io", "IO", ["time", "read", "write"], "Usage [ MB/s ]")
      csv_chart(net_data, "id_net", "Network", ["time", "recv", "send"], "Usage [ MB/s ]")
      csv_chart(sys_data, "id_sys", "System", ["time", "interrupts", "context switches"], "")
      csv_chart(proc_data, "id_proc", "Processes", ["time", "run", "blk", "new"], "")
      csv_chart(pag_data, "id_pag", "Paging", ["time", "in", "out"], "")
    },
    error: function(request, status, error) {
      console.log(status);
      console.log(error);
    }
  });
};

function csv_chart(data, id, title, labels, ylabel) {
  //console.log('csv_chart');
  //console.log(data);
  chart = new Dygraph(
    document.getElementById(id),
    data,
    {
      labels: labels,
      //http://colorbrewer2.org/  <- qualitative, 6 classes
      colors: ['rgb(228,26,28)','rgb(55,126,184)','rgb(77,175,74)','rgb(152,78,163)','rgb(255,127,0)','rgb(141,211,199)'],
      xlabel: "Time [ H:M:S ]",
      ylabel: ylabel,
      strokeWidth: 2,
      legend: 'always',
      labelsDivWidth: 500,
      title: title
    }
  )
  return chart
}

load_csv();
if (refresh_page) {
  $("#id_refresh").text("Page will refresh every second. ")
  var refresh=setInterval(function () {load_csv()}, 1000);  //Refresh page every 5 sec
}
