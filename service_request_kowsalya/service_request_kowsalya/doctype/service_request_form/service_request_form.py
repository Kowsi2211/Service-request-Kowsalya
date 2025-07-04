# Copyright (c) 2025, kowsalya and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class ServiceRequestForm(Document):
	def validate(doc):

		frappe.sendmail(
			recipients=[doc.contact_email],
			subject="Your Service Request - Ref: {}".format(doc.name),
			message="""
			<h3>Dear {},</h3>
			<p>Thank you for submitting your request.</p>
			<p>Your reference number is <b>{}</b>.</p>
			<p>Our team will respond within 48 hours.</p>
			<p>Regards,</p>
			<h5>Public Service Team</h5>
			""".format(doc.customer, doc.name)
		)


@frappe.whitelist()
def get_value(value):
	service_request = frappe.get_doc("Service Request Form", value)
	issue = frappe.new_doc("Issue")
	issue.subject = f"Service Request : {service_request.name}"
	issue.customer = service_request.customer
	issue.priority = service_request.priority
	issue.issue_type = service_request.request_type
	issue.description = service_request.description
	issue.insert()
	return issue.name

@frappe.whitelist()
def get_item(item):
	item_prices = frappe.get_all(
		"Item Price",
		filters={"item_code": item},
		fields=["price_list_rate"]
	)
	

	return item_prices

