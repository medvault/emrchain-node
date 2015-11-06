define(function() {
	'use strict';

	/* return an array of specs to be run */
	return {
		specs: ['spec/collections/orders.js',
		'spec/collections/partner_sales.js',
		'spec/collections/partners.js',
		'spec/collections/sales.js',
		'spec/exampleTest.js',
		'spec/models/order.js',
		'spec/models/partner.js',
		'spec/models/partner_sale.js',
		'spec/models/sale.js',
		'spec/views/collection/orders_view.js',
		'spec/views/collection/partners_view.js',
		'spec/views/collection/sales_view.js',
		'spec/views/item/order_view.js',
		'spec/views/item/partner_view.js',
		'spec/views/item/sale_view.js',
		'spec/views/layout/app_container.js'
		]
	};
});
