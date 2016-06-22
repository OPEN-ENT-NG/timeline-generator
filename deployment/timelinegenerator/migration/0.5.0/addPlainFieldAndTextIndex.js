db.timelinegenerator.find({"text" : { "$exists" : true}}, { "_id" : 1, "text" : 1 }).forEach(function(tlg) {
  var text = tlg.text.replace(/<[^>]*>/g, '');
  db.timelinegenerator.update({"_id" : tlg._id}, { $set : { "textPlain" : text}});
});

db.timelinegenerator.createIndex({ "headline": "text", "textPlain": "text"});