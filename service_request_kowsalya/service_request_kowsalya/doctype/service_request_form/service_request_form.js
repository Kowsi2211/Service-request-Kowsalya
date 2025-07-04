// Copyright (c) 2025, kowsalya and contributors
// For license information, please see license.txt

frappe.ui.form.on("Service Request Form", {
	contact_email(frm) {
		frm.set_df_property(
			"contact_email",
			"description",
			'Please enter a valid email with "@" and ".com"'
		);
	},
	contact_number(frm) {
		frm.set_df_property("contact_email", "description", " ");
	},
	validate(frm) {
		
		if (frm.doc.workflow_state != "Submitted" && frm.doc.total_estimated_hours) {
			let dialog = new frappe.ui.Dialog({
				title: "Request Form",
				fields: [
					{
						label: __("Customer"),
						fieldname: "customer",
						fieldtype: "Data",
						default: frm.doc.customer,
						read_only: 1,
					},
					{
						label: __("Request Type"),
						fieldname: "request_type",
						fieldtype: "Select",
						options: ["Installation", "Maintenance", "Repair"],
						default: frm.doc.request_type,
						read_only: 1,
					},
					{
						label: __("Priority"),
						fieldname: "priority",
						fieldtype: "Select",
						options: ["Low", "Medium", "High"],
						default: frm.doc.priority,
						read_only: 1,
					},
					{
						label: __("Total Estimated Hours"),
						fieldname: "total_estimated_hours",
						fieldtype: "Data",
						default: frm.doc.total_estimated_hours,
						read_only: 1,
					},
					{
						label: __("Total Estimated Cost"),
						fieldname: "total_estimated_cost",
						fieldtype: "Data",
						default: frm.doc.total_estimated_cost,
					},
				],
				primary_action_label: "Confirm",
				primary_action(values) {
					frm.set_value("total_estimated_cost", values.total_estimated_cost);

					frm.set_value("workflow_state", "Submitted");
					frm.save("Submit");

					dialog.hide();
				},
				secondary_action_label: "Edit",
				secondary_action() {
					frm.set_value("workflow_state", "Draft");
					dialog.hide();
				},
			});
			dialog.show();
		}
		if (frm.doc.workflow_state == "Submitted" && frm.doc.check == 0) {
			if (frm.doc.create_issue == 1) {
				frappe.call({
					method: "service_request_kowsalya.service_request_kowsalya.doctype.service_request_form.service_request_form.get_value",
					args: {
						value: frm.doc.name,
					},
					callback: function (r) {
						if (r.message) {
							frappe.msgprint(`Issue ${r.message} created successfully.`);
						}
					},
				});
			}
		}
	},
	before_save: function (frm) {
		if (!frm.doc.service_items || frm.doc.service_items.length === 0) {
			frappe.throw("Please fill the Item Details before submitting.");
		}
	},
});
frappe.ui.form.on("Service Items", {
	// for fetching price rate from item price
	item(frm, cdt, cdn) {
		let row = locals[cdt][cdn];
		frappe.call({
			method: "service_request_kowsalya.service_request_kowsalya.doctype.service_request_form.service_request_form.get_item",
			args: {
				item: row.item,
			},
			callback: function (r) {
				let items = r.message;
				items.forEach((item) => {
					frappe.model.set_value(cdt, cdn, "item_price", item.price_list_rate);
				});
			},
		});
	},

	estimated_hours(frm, cdt, cdn) {
		let row = locals[cdt][cdn];
		let estimated_cost = row.estimated_hours * row.item_price;
		frappe.model.set_value(cdt, cdn, "estimated_cost", estimated_cost).then(() => {
			update_service_totals(frm);
		});
	},

	service_items_remove(frm) {
		update_service_totals(frm);
	},
});

function update_service_totals(frm) {
	let total_estimated_hr = 0;
	let total_estimated_cost = 0;

	frm.doc.service_items.forEach((row) => {
		total_estimated_hr += row.estimated_hours;
		total_estimated_cost += row.estimated_cost;
	});

	frm.set_value("total_estimated_hours", total_estimated_hr);
	frm.set_value("total_estimated_cost", total_estimated_cost);
}
