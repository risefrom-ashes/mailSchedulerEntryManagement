var bodyParser = require("body-parser"),
	methodOverride = require("method-override"),
	express = require("express"),
	app = express(),
	mongoose = require("mongoose"),
	nodemailer = require("nodemailer"),
	cron = require("node-cron"),
	Nexmo = require("nexmo");

mongoose.set("useNewUrlParser", true);
mongoose.set("useFindAndModify", false);
mongoose.set("useCreateIndex", true);
mongoose.set("useUnifiedTopology", true);
mongoose.Promise = require("bluebird");

const url1 = "mongodb://vikram:vikram1@ds243049.mlab.com:43049/stap";
const url2 = "mongodb+srv://vikram:vikram@practice-kpo5w.mongodb.net/test?retryWrites=true&w=majority";

mongoose.connect(url2);

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({
	extended: true
}));


const Schema = mongoose.Schema;
app.use(methodOverride("_method"));

var nexmo = new Nexmo({
	apiKey: '9a947a20',
	apiSecret: 'vAZUZuB6u23MQJjt'
}, {
	debug: true
})
//-----------------Schemas-----------------//

var formSchema = new mongoose.Schema({
	myName: String,
	myMail: String,
	myPhone: String,
	checkInTime: String,
	checkOutTime: String,
	hostName: String,
	hostMail: String,
	hostPhone: String,
	created: {
		type: Date,
		default: Date.now
	},
	address: {
		type: String,
		default: "Host Address"
	}
});

var Form = mongoose.model("form", formSchema);


//-----------------Routes-----------------//

app.get("/", function (req, res) {
	res.redirect("/entry");
});

app.get("/entry", function (req, res) {
	res.render("entry");
});

app.post("/entry", function (req, res) {
	var entry = req.body.entry;
	console.log(entry)
	Form.create(entry, function (err, newEntry) {
		if (err) {
			res.send(err);
		} else {
			res.redirect("/entry");
			
			var hostMessageText="The Details are : - \n" +
					"Name : " + newEntry.myName + "\n" +
					"Email : " + newEntry.myMail + "\n" +
					"Phone : " + newEntry.myPhone + "\n" +
					"Check In Time : " + newEntry.checkInTime + "\n" +
					"Check Out Time : " + newEntry.checkOutTime;
			
			var mailOptionsReceiver = {
				from: "mailschedulerentrymanagement@gmail.com",
				to: newEntry.hostMail,
				subject: "Details of upcoming visitor",
				text: hostMessageText
			};
			var transporter = nodemailer.createTransport({
				service: "gmail",
				auth: {
					user: "mailschedulerentrymanagement@gmail.com",
					pass: "V*k$1ml212665"
				}
			});
			transporter.sendMail(mailOptionsReceiver, function (err, info) {
				if (err) {
					console.log(err);
				} else {
					console.log("Email sent: " + info.response);
				}
			});
			
			nexmo.message.sendSms("NEXMO", newEntry.hostPhone, hostMessageText, {
				type: 'unicode'
			}, function (err, responseData) {
				if(err) console.log(err)
				else{
					console.log("Message sent")
					console.log(responseData)
				}
			})

			console.log("111 ", newEntry, newEntry.checkOutTime)
			var checkoutTimeArray = newEntry.checkOutTime.split(':');
			var checkoutH = checkoutTimeArray[0];
			var checkoutM = checkoutTimeArray[1];
			console.log(checkoutH, checkoutM)
			
			var visitorMessageText = "The Details are : - \n" +
					"Name : " + newEntry.myName + "\n" +
					"Email : " + newEntry.myMail + "\n" +
					"Phone : " + newEntry.myPhone + "\n" +
					"Check In Time : " + newEntry.checkInTime + "\n" +
					"Check Out Time : " + newEntry.checkOutTime + "\n" + newEntry.address + "\n";
			
			var mailOptionsVisitor = {
				from: "mailschedulerentrymanagement@gmail.com",
				to: newEntry.myMail,
				subject: "Details of your visit",
				text: visitorMessageText
			};

			cron.schedule(`${checkoutM} ${checkoutH} * * *`, () => {
				transporter.sendMail(mailOptionsVisitor, function (error, info) {
					if (error) {
						console.log(error);
					} else {
						console.log('Email sent: ' + info.response);
					}
				});
			});
		}
	});
});


const port = 5000;

app.listen(process.env.PORT || port, function () {
	var date = new Date();
	var time = date.getHours();
	time += ":";
	time += date.getMinutes();
	time += ":";
	time += date.getSeconds();
	console.log("server started at " + time + " at http://localhost:5000");
});
